import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Messages from "@/pages/Messages";
import { api } from "@/lib/api";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock("@/lib/api", () => ({
  api: apiMock,
  assertArray: (value: unknown) => value,
}));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/BackButton", () => ({ default: () => null }));

const conversation = {
  id: "conversation-1",
  listingId: "listing-1",
  listingTitle: "Robe traditionnelle",
  otherName: "Amadou",
  lastMessage: "Bonjour",
  lastMessageAt: "2026-11-02T10:00:00.000Z",
};

describe("page de messagerie", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    apiMock.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/conversations") return [conversation];
      if (path === "/api/conversations/conversation-1" && options?.method === "POST") return { sent: true };
      if (path === "/api/conversations/conversation-1") return [];
      return [];
    });
  });

  it("affiche le destinataire et envoie le texte nettoyé dans la conversation active", async () => {
    render(
      <MemoryRouter initialEntries={["/messages/conversation-1"]}>
        <Routes>
          <Route path="/messages/:id" element={<Messages />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Conversation avec Amadou")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Écrire un message…");
    fireEvent.change(input, { target: { value: "  Bonjour Amadou  " } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));

    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/conversations/conversation-1", {
      method: "POST",
      body: JSON.stringify({ message: "Bonjour Amadou" }),
    }));
    await waitFor(() => expect(input).toHaveValue(""));
  });
});
