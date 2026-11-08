
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CameraCapture from "@/components/CameraCapture";

function makeStream() {
  const tracks = [
    { stop: vi.fn() },
    { stop: vi.fn() },
  ];

  const stream = {
    getTracks: () => tracks,
  } as unknown as MediaStream;

  return { stream, tracks };
}

describe("CameraCapture", () => {
  const originalMediaDevices = Object.getOwnPropertyDescriptor(
    navigator,
    "mediaDevices"
  );

  let getUserMedia: ReturnType<typeof vi.fn>;
  let drawImage: ReturnType<typeof vi.fn>;
  let toBlob: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getUserMedia = vi.fn();

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    drawImage = vi.fn();

    toBlob = vi.fn((callback: BlobCallback) =>
      callback(new Blob(["photo"], { type: "image/jpeg" }))
    );

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(toBlob);

    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    vi.spyOn(Date, "now").mockReturnValue(1735689600000);
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalMediaDevices) {
      Object.defineProperty(
        navigator,
        "mediaDevices",
        originalMediaDevices
      );
    } else {
      Reflect.deleteProperty(navigator, "mediaDevices");
    }
  });

  it("ne demande pas la permission avant un clic utilisateur et demande la caméra arrière sans audio", async () => {
    const { stream } = makeStream();

    getUserMedia.mockResolvedValue(stream);

    render(
      <CameraCapture
        onCapture={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(getUserMedia).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: /activer la caméra/i,
      })
    );

    await waitFor(() =>
      expect(getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      })
    );
  });

  it("produit un JPEG au clic de capture et arrête toutes les pistes", async () => {
    const { stream, tracks } = makeStream();

    getUserMedia.mockResolvedValue(stream);

    const onCapture = vi.fn();

    render(
      <CameraCapture
        onCapture={onCapture}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /activer la caméra/i,
      })
    );

    await screen.findByRole("button", {
      name: /prendre la photo/i,
    });

    const video = document.querySelector("video");

    if (!video) {
      throw new Error("Aperçu vidéo absent");
    }

    Object.defineProperty(video, "videoWidth", {
      configurable: true,
      value: 1280,
    });

    Object.defineProperty(video, "videoHeight", {
      configurable: true,
      value: 720,
    });

    expect(onCapture).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: /prendre la photo/i,
      })
    );

    await waitFor(() =>
      expect(onCapture).toHaveBeenCalledTimes(1)
    );

    const file = onCapture.mock.calls[0][0] as File;

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("madclothes-camera-1735689600000.jpg");

    expect(drawImage).toHaveBeenCalledWith(
      video,
      0,
      0,
      1280,
      720
    );

    expect(toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/jpeg",
      0.92
    );

    expect(
      tracks.every((track) => track.stop.mock.calls.length === 1)
    ).toBe(true);
  });

  it("affiche une erreur accessible lorsque la permission est refusée", async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error("Denied"), {
        name: "NotAllowedError",
      })
    );

    render(
      <CameraCapture
        onCapture={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /activer la caméra/i,
      })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /autorisation.*refusée|refusée.*caméra/i
    );
  });

  it("arrête toutes les pistes au démontage", async () => {
    const { stream, tracks } = makeStream();

    getUserMedia.mockResolvedValue(stream);

    const view = render(
      <CameraCapture
        onCapture={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /activer la caméra/i,
      })
    );

    await screen.findByRole("button", {
      name: /prendre la photo/i,
    });

    view.unmount();

    expect(
      tracks.every((track) => track.stop.mock.calls.length === 1)
    ).toBe(true);
  });
});

