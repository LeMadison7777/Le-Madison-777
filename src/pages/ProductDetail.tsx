import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MapPin, ShieldCheck, Truck, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import { Button } from "@/components/ui/button";
import { PRODUCTS, conditionStyles } from "@/data/products";
import { toast } from "@/hooks/use-toast";
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) {
    return (
      <div className="min-h-screen bg-background relative">
        <BackgroundFX />
        <Navbar />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-display text-3xl mb-4">Article introuvable</h1>
          <Link to="/boutique">
            <Button className="rounded-full glow-shadow">Retour à la boutique</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);
  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundFX />
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 mb-8 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="grid lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative glass glass-border-glow rounded-2xl overflow-hidden aspect-square"
          >
            <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
            <span className={`absolute top-4 left-4 text-xs px-3 py-1 rounded-full border backdrop-blur-md ${conditionStyles[product.condition]}`}>
              {product.condition}
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col"
          >
            <p className="text-mono text-xs text-primary mb-3">— {product.category}</p>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{product.name}</h1>
            <p className="text-muted-foreground text-mono mb-6">{product.brand} • Taille {product.size}</p>
            <p className="font-display text-4xl font-bold text-primary neon-orange mb-6">
              {product.price.toLocaleString("fr-FR")} <span className="text-base text-muted-foreground font-body font-normal">FCFA</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <MapPin size={14} /> {product.location}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button
                onClick={() => toast({ title: "Article réservé", description: "Le vendeur a été notifié de votre intérêt." })}
                className="rounded-full glow-shadow flex-1"
                size="lg"
              >
                Acheter maintenant
              </Button>
              <Button
                onClick={() => toast({ title: "Ajouté aux favoris ❤️" })}
                variant="outline"
                size="lg"
                className="rounded-full border-white/15 gap-2"
              >
                <Heart size={16} /> Favoris
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="text-primary shrink-0 mt-1" size={18} />
                <div>
                  <p className="font-display font-semibold text-sm">Paiement sécurisé</p>
                  <p className="text-xs text-muted-foreground">Mobile Money & carte</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 flex items-start gap-3">
                <Truck className="text-primary shrink-0 mt-1" size={18} />
                <div>
                  <p className="font-display font-semibold text-sm">Livraison 48h</p>
                  <p className="text-xs text-muted-foreground">Toute l'Afrique</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to={`/article/${p.id}`}
                  className="group glass glass-border-glow rounded-[16px] overflow-hidden hover-glow-orange flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="font-display text-base font-bold text-primary mt-1">
                      {p.price.toLocaleString("fr-FR")} <span className="text-xs text-muted-foreground font-body font-normal">FCFA</span>
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2 group-hover:text-primary">
                      Voir <ArrowUpRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};
export default ProductDetail;
