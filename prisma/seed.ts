import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Toutes les images proviennent d'Unsplash (libres d'utilisation).
const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

async function main() {
  console.log("🌱 Réinitialisation de la base...");
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("eclat1234", 10);

  // --- Hôtes (membres vérifiés) ---
  const hosts = await Promise.all([
    prisma.user.create({
      data: {
        email: "isabelle@eclat.com",
        password: hashedPassword,
        name: "Isabelle Laurent",
        role: "HOST",
        verified: true,
        avatarUrl: img("photo-1438761681033-6461ffad8d80"),
        bio: "Curatrice de propriétés d'exception sur la Côte d'Azur depuis 15 ans.",
      },
    }),
    prisma.user.create({
      data: {
        email: "maxime@eclat.com",
        password: hashedPassword,
        name: "Maxime Renaud",
        role: "HOST",
        verified: true,
        avatarUrl: img("photo-1500648767791-00dcc994a43e"),
        bio: "Spécialiste des chalets et domaines alpins haut de gamme.",
      },
    }),
  ]);

  // --- Invité de démonstration ---
  await prisma.user.create({
    data: {
      email: "client@eclat.com",
      password: hashedPassword,
      name: "Camille Moreau",
      role: "GUEST",
      verified: true,
      avatarUrl: img("photo-1494790108377-be9c29b29330"),
    },
  });

  // --- Admin ---
  await prisma.user.create({
    data: {
      email: "admin@eclat.com",
      password: hashedPassword,
      name: "Éclat Admin",
      role: "ADMIN",
      verified: true,
    },
  });

  type Seed = {
    title: string;
    description: string;
    pricePerNight: number;
    city: string;
    country: string;
    address: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    propertyType: string;
    images: string[];
    amenities: string[];
    featured: boolean;
    hostId: string;
  };

  const properties: Seed[] = [
    {
      title: "Villa Sérénité — vue panoramique sur la baie",
      description:
        "Perchée sur les hauteurs, cette villa contemporaine offre une vue à 180° sur la Méditerranée. Piscine à débordement, vastes terrasses en teck et espaces de réception baignés de lumière. Une adresse confidentielle pensée pour un séjour sans la moindre fausse note.",
      pricePerNight: 1450,
      city: "Saint-Tropez",
      country: "France",
      address: "Chemin des Salins, Saint-Tropez",
      bedrooms: 5,
      bathrooms: 6,
      maxGuests: 10,
      propertyType: "Villa",
      images: [
        img("photo-1613490493576-7fde63acd811"),
        img("photo-1512917774080-9991f1c4c750"),
        img("photo-1600596542815-ffad4c1539a9"),
        img("photo-1600585154340-be6161a56a0c"),
      ],
      amenities: [
        "Piscine privée",
        "Vue mer",
        "Conciergerie 24/7",
        "Chef privé sur demande",
        "Jardin paysager",
        "Climatisation",
        "Wi-Fi fibre",
        "Parking sécurisé",
      ],
      featured: true,
      hostId: hosts[0].id,
    },
    {
      title: "Penthouse Lumière — toit-terrasse au cœur de Paris",
      description:
        "Au dernier étage d'un immeuble haussmannien, ce penthouse marie moulures d'origine et design signé. Toit-terrasse privatif avec vue sur les toits de Paris, cave à vin et home cinéma. L'élégance parisienne dans sa version la plus aboutie.",
      pricePerNight: 980,
      city: "Paris",
      country: "France",
      address: "Avenue Montaigne, 75008 Paris",
      bedrooms: 3,
      bathrooms: 3,
      maxGuests: 6,
      propertyType: "Penthouse",
      images: [
        img("photo-1502672260266-1c1ef2d93688"),
        img("photo-1522708323590-d24dbb6b0267"),
        img("photo-1560448204-e02f11c3d0e2"),
        img("photo-1493809842364-78817add7ffb"),
      ],
      amenities: [
        "Vue mer",
        "Cave à vin",
        "Home cinéma",
        "Conciergerie 24/7",
        "Climatisation",
        "Wi-Fi fibre",
        "Cheminée",
      ],
      featured: true,
      hostId: hosts[0].id,
    },
    {
      title: "Chalet Aurore — luxe alpin face au Mont-Blanc",
      description:
        "Un chalet d'exception en plein cœur des Alpes, alliant bois ancien et confort absolu. Spa privatif, ski-in/ski-out, cheminée monumentale et personnel de maison. Le refuge idéal après une journée sur les pistes.",
      pricePerNight: 1690,
      city: "Megève",
      country: "France",
      address: "Route du Mont d'Arbois, Megève",
      bedrooms: 6,
      bathrooms: 5,
      maxGuests: 12,
      propertyType: "Chalet",
      images: [
        img("photo-1502784444187-359ac186c5bb"),
        img("photo-1449158743715-0a90ebb6d2d8"),
        img("photo-1520250497591-112f2f40a3f4"),
        img("photo-1551524559-8af4e6624178"),
      ],
      amenities: [
        "Spa & sauna",
        "Cheminée",
        "Personnel de maison",
        "Cave à vin",
        "Wi-Fi fibre",
        "Parking sécurisé",
        "Home cinéma",
      ],
      featured: true,
      hostId: hosts[1].id,
    },
    {
      title: "Domaine des Oliviers — propriété viticole en Provence",
      description:
        "Un domaine du XVIIIᵉ siècle entièrement rénové, niché parmi les oliviers et les vignes. Piscine chauffée, cuisine d'été, vastes jardins et calme absolu. L'authenticité provençale rehaussée d'un confort contemporain.",
      pricePerNight: 760,
      city: "Aix-en-Provence",
      country: "France",
      address: "Route de Cézanne, Aix-en-Provence",
      bedrooms: 5,
      bathrooms: 4,
      maxGuests: 10,
      propertyType: "Domaine",
      images: [
        img("photo-1568605114967-8130f3a36994"),
        img("photo-1600607687939-ce8a6c25118c"),
        img("photo-1600566753086-00f18fb6b3ea"),
        img("photo-1600585154526-990dced4db0d"),
      ],
      amenities: [
        "Piscine privée",
        "Jardin paysager",
        "Cave à vin",
        "Cheminée",
        "Wi-Fi fibre",
        "Climatisation",
        "Parking sécurisé",
      ],
      featured: false,
      hostId: hosts[0].id,
    },
    {
      title: "Loft Atelier — espace d'artiste sur la Croisette",
      description:
        "Ancien atelier transformé en loft d'exception à deux pas de la Croisette. Volumes spectaculaires, verrières d'origine, mobilier de designers et terrasse privée. Une adresse rare pour le Festival comme pour l'année.",
      pricePerNight: 540,
      city: "Cannes",
      country: "France",
      address: "Rue d'Antibes, Cannes",
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      propertyType: "Loft",
      images: [
        img("photo-1556912172-45b7abe8b7e1"),
        img("photo-1505691938895-1758d7feb511"),
        img("photo-1502005229762-cf1b2da7c5d6"),
        img("photo-1567767292278-a4f21aa2d36e"),
      ],
      amenities: [
        "Vue mer",
        "Climatisation",
        "Wi-Fi fibre",
        "Conciergerie 24/7",
        "Accès plage privé",
      ],
      featured: false,
      hostId: hosts[0].id,
    },
    {
      title: "Manoir Belvédère — élégance anglaise au bord du lac",
      description:
        "Un manoir d'époque restauré avec un soin extrême, surplombant un lac privé. Bibliothèque, salle de billard, spa et parc de 4 hectares. Le raffinement d'une maison de famille, le service d'un palace.",
      pricePerNight: 2200,
      city: "Annecy",
      country: "France",
      address: "Route du Lac, Annecy",
      bedrooms: 8,
      bathrooms: 7,
      maxGuests: 16,
      propertyType: "Manoir",
      images: [
        img("photo-1518780664697-55e3ad937233"),
        img("photo-1505693416388-ac5ce068fe85"),
        img("photo-1600210492486-724fe5c67fb0"),
        img("photo-1564013799919-ab600027ffc6"),
      ],
      amenities: [
        "Spa & sauna",
        "Personnel de maison",
        "Cave à vin",
        "Cheminée",
        "Jardin paysager",
        "Salle de sport",
        "Parking sécurisé",
        "Wi-Fi fibre",
      ],
      featured: true,
      hostId: hosts[1].id,
    },
    {
      title: "Riad Yasmine — oasis confidentielle dans la médina",
      description:
        "Un riad d'exception au cœur de la médina, organisé autour d'un patio à la fontaine murmurante. Hammam privé, toit-terrasse, zelliges faits main et service irréprochable. Une parenthèse hors du temps.",
      pricePerNight: 420,
      city: "Marrakech",
      country: "Maroc",
      address: "Derb Lahbib, Médina, Marrakech",
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
      propertyType: "Riad",
      images: [
        img("photo-1539020140153-e479b8c22e70"),
        img("photo-1578774204375-826dc5d996ed"),
        img("photo-1591088398332-8a7791972843"),
        img("photo-1560185007-cde436f6a4d0"),
      ],
      amenities: [
        "Spa & sauna",
        "Personnel de maison",
        "Piscine privée",
        "Climatisation",
        "Wi-Fi fibre",
        "Chef privé sur demande",
      ],
      featured: false,
      hostId: hosts[1].id,
    },
    {
      title: "Villa Azzurra — front de mer sur la côte amalfitaine",
      description:
        "Accrochée à la falaise, cette villa domine la mer d'un bleu profond. Accès privé à la crique, piscine à débordement, pergolas fleuries et cuisine méditerranéenne. La dolce vita dans son écrin le plus pur.",
      pricePerNight: 1850,
      city: "Positano",
      country: "Italie",
      address: "Via Positanesi d'America, Positano",
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
      propertyType: "Villa",
      images: [
        img("photo-1545324418-cc1a3fa10c00"),
        img("photo-1582719478250-c89cae4dc85b"),
        img("photo-1571896349842-33c89424de2d"),
        img("photo-1591088398332-8a7791972843"),
      ],
      amenities: [
        "Piscine privée",
        "Vue mer",
        "Accès plage privé",
        "Chef privé sur demande",
        "Conciergerie 24/7",
        "Climatisation",
        "Wi-Fi fibre",
      ],
      featured: true,
      hostId: hosts[0].id,
    },
  ];

  for (const p of properties) {
    await prisma.property.create({
      data: {
        title: p.title,
        description: p.description,
        pricePerNight: p.pricePerNight,
        city: p.city,
        country: p.country,
        address: p.address,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        maxGuests: p.maxGuests,
        propertyType: p.propertyType,
        images: p.images.join(","),
        amenities: p.amenities.join(","),
        featured: p.featured,
        hostId: p.hostId,
      },
    });
  }

  console.log(`✅ ${properties.length} biens d'exception créés.`);
  console.log("👤 Comptes de démo (mot de passe : eclat1234) :");
  console.log("   - client@eclat.com (invité)");
  console.log("   - isabelle@eclat.com (hôte)");
  console.log("   - admin@eclat.com (admin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
