"use client";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useRef, JSX } from "react";
import { ComponentProps } from "lib/component-props";
import styles from "./RoomVisualizer.module.css";

interface RoomVisualizerProps extends ComponentProps {}

interface Product {
  id: string;
  sku: string;
  title: string;
  price: number;
  discountPrice?: number;
  mainImage: string;
  shortDescription?: string;
}

// Interactive 3D Placed Item State
interface Placed3DItem {
  id: string;
  sku: string;
  title: string;
  category: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  scale: number; // multiplier (0.5 to 2.5)
  rotY: number; // Y rotation (degrees)
  rotX: number; // X tilt (degrees)
  material: string; // HSL material code
  materialName: string;
}

// 3D Point Types
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face {
  vertices: Point3D[];
  color: string; // Base HSL color e.g. "35, 45%, 45%"
  normal: Point3D;
  avgZ?: number;
}

// 3D Material presets
const MATERIALS = [
  { name: "Oak Wood", value: "35, 45%" },
  { name: "Walnut Wood", value: "20, 35%" },
  { name: "Crimson Velvet", value: "355, 75%" },
  { name: "Royal Blue Fabric", value: "220, 70%" },
  { name: "Forest Green Fabric", value: "140, 50%" },
  { name: "Modern Steel", value: "0, 0%" },
];

const ROOM_TEMPLATES = [
  {
    name: "Modern Living Room",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200",
  },
  {
    name: "Minimalist Bedroom",
    url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200",
  },
  {
    name: "Cozy Dining Room",
    url: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=1200",
  },
];

// 3D Rotation Functions
function rotateY(p: Point3D, angleDeg: number): Point3D {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: p.x * cos - p.z * sin,
    y: p.y,
    z: p.x * sin + p.z * cos,
  };
}

function rotateX(p: Point3D, angleDeg: number): Point3D {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: p.x,
    y: p.y * cos - p.z * sin,
    z: p.y * sin + p.z * cos,
  };
}

export const Default = (props: RoomVisualizerProps): JSX.Element => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const { params } = props;
  const renderId = params.RenderingIdentifier;

  // React State
  const [products, setProducts] = useState<Product[]>([]);
  const [bgImage, setBgImage] = useState(ROOM_TEMPLATES[0].url);
  const [activeItems, setActiveItems] = useState<Placed3DItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("All");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragInfo = useRef<{
    isDragging: boolean;
    itemId: string | null;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  }>({
    isDragging: false,
    itemId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  // Fetch products
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn("Failed to load products for visualizer:", err))
      .finally(() => setLoading(false));
  }, []);

  // Redraw Canvas whenever items change
  useEffect(() => {
    drawScene();
  }, [activeItems, selectedItemId, bgImage]);

  // Handle custom room photo upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Detect which category a product belongs to
  const getProductCategory = (prod: Product): string => {
    const title = prod.title.toLowerCase();
    if (title.includes("sofa") || title.includes("loveseat") || title.includes("couch")) return "Sofa";
    if (title.includes("chair")) return "Chair";
    if (title.includes("table") || title.includes("desk")) return "Table";
    if (title.includes("lamp") || title.includes("light") || title.includes("chandelier")) return "Lamp";
    if (title.includes("bed") || title.includes("mattress")) return "Bed";
    if (title.includes("clock")) return "Clock";
    if (title.includes("wardrobe") || title.includes("cabinet")) return "Cabinet";
    if (title.includes("hammock")) return "Hammock";
    return "Chair"; // Default
  };

  // Add Item to 3D Canvas
  const addItemToCanvas = (prod: Product) => {
    const category = getProductCategory(prod);
    const defaultMaterial = MATERIALS[0]; // Oak Wood
    const newItem: Placed3DItem = {
      id: Math.random().toString(36).substr(2, 9),
      sku: prod.sku,
      title: prod.title,
      category,
      x: 50,
      y: 60,
      scale: 1.0,
      rotY: 0,
      rotX: 10, // Slight tilt for 3D realism
      material: defaultMaterial.value,
      materialName: defaultMaterial.name,
    };
    setActiveItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // 3D Geometry Block Faces Generator
  const generateBlockFaces = (
    dx: number, dy: number, dz: number,
    sx: number, sy: number, sz: number,
    baseColor: string
  ): Face[] => {
    // 8 local vertices of the block
    const localVerts: Point3D[] = [
      { x: -sx / 2, y: -sy / 2, z: -sz / 2 },
      { x: sx / 2, y: -sy / 2, z: -sz / 2 },
      { x: sx / 2, y: sy / 2, z: -sz / 2 },
      { x: -sx / 2, y: sy / 2, z: -sz / 2 },
      { x: -sx / 2, y: -sy / 2, z: sz / 2 },
      { x: sx / 2, y: -sy / 2, z: sz / 2 },
      { x: sx / 2, y: sy / 2, z: sz / 2 },
      { x: -sx / 2, y: sy / 2, z: sz / 2 },
    ];

    // Offset them to correct sub-block position
    const verts = localVerts.map((v) => ({
      x: v.x + dx,
      y: v.y + dy,
      z: v.z + dz,
    }));

    // Definitions of the 6 faces mapping indices of verts
    return [
      { vertices: [verts[0], verts[1], verts[2], verts[3]], color: baseColor, normal: { x: 0, y: 0, z: -1 } }, // Back
      { vertices: [verts[1], verts[5], verts[6], verts[2]], color: baseColor, normal: { x: 1, y: 0, z: 0 } },  // Right
      { vertices: [verts[4], verts[0], verts[3], verts[7]], color: baseColor, normal: { x: -1, y: 0, z: 0 } }, // Left
      { vertices: [verts[5], verts[4], verts[7], verts[6]], color: baseColor, normal: { x: 0, y: 0, z: 1 } },  // Front
      { vertices: [verts[3], verts[2], verts[6], verts[7]], color: baseColor, normal: { x: 0, y: 1, z: 0 } },  // Top
      { vertices: [verts[0], verts[4], verts[5], verts[1]], color: baseColor, normal: { x: 0, y: -1, z: 0 } }, // Bottom
    ];
  };

  // Generate 3D Scene Mesh Faces for a Placed Item
  const get3DItemFaces = (item: Placed3DItem): Face[] => {
    const mat = item.material;
    const title = item.title.toLowerCase();
    let faces: Face[] = [];

    // Helper HSL levels for texture look
    const mainCol = `${mat}, 45%`;
    const accentCol = `${mat}, 25%`;
    const cushionCol = `${mat}, 55%`;

    if (item.category === "Sofa") {
      if (title.includes("loveseat") || title.includes("studio")) {
        // Compact 2-seater Sofa
        faces = faces.concat(generateBlockFaces(0, 10, 0, 110, 25, 75, mainCol));
        faces = faces.concat(generateBlockFaces(0, -25, -28, 110, 45, 18, accentCol));
        faces = faces.concat(generateBlockFaces(-56, -5, 0, 18, 45, 75, cushionCol));
        faces = faces.concat(generateBlockFaces(56, -5, 0, 18, 45, 75, cushionCol));
      } else if (title.includes("sectional") || title.includes("l-shape") || title.includes("corner")) {
        // L-shaped Corner Sofa
        faces = faces.concat(generateBlockFaces(-25, 10, 0, 110, 25, 75, mainCol));
        faces = faces.concat(generateBlockFaces(-25, -25, -28, 110, 45, 18, accentCol));
        faces = faces.concat(generateBlockFaces(-80, -5, 0, 18, 45, 75, cushionCol));
        // L forward section
        faces = faces.concat(generateBlockFaces(45, 10, 25, 60, 25, 125, mainCol));
        faces = faces.concat(generateBlockFaces(45, -25, 80, 60, 45, 18, cushionCol));
      } else {
        // Standard 3-seater Sofa
        faces = faces.concat(generateBlockFaces(0, 10, 0, 160, 25, 75, mainCol));
        faces = faces.concat(generateBlockFaces(0, -25, -28, 160, 45, 18, accentCol));
        faces = faces.concat(generateBlockFaces(-81, -5, 0, 18, 45, 75, cushionCol));
        faces = faces.concat(generateBlockFaces(81, -5, 0, 18, 45, 75, cushionCol));
      }
    } else if (item.category === "Chair") {
      if (title.includes("stool") || title.includes("bar")) {
        // Bar Stool (no backrest, tall legs)
        faces = faces.concat(generateBlockFaces(0, -15, 0, 40, 8, 40, mainCol));
        faces = faces.concat(generateBlockFaces(-14, 25, -14, 5, 80, 5, accentCol));
        faces = faces.concat(generateBlockFaces(14, 25, -14, 5, 80, 5, accentCol));
        faces = faces.concat(generateBlockFaces(-14, 25, 14, 5, 80, 5, accentCol));
        faces = faces.concat(generateBlockFaces(14, 25, 14, 5, 80, 5, accentCol));
      } else if (title.includes("armchair") || title.includes("lounge")) {
        // Comfy lounge chair with arms
        faces = faces.concat(generateBlockFaces(0, -2, 0, 70, 12, 70, mainCol));
        faces = faces.concat(generateBlockFaces(0, -25, -29, 70, 45, 12, cushionCol));
        faces = faces.concat(generateBlockFaces(-36, -8, 0, 12, 35, 70, cushionCol));
        faces = faces.concat(generateBlockFaces(36, -8, 0, 12, 35, 70, cushionCol));
        faces = faces.concat(generateBlockFaces(-28, 25, -28, 6, 40, 6, accentCol));
        faces = faces.concat(generateBlockFaces(28, 25, -28, 6, 40, 6, accentCol));
        faces = faces.concat(generateBlockFaces(-28, 25, 28, 6, 40, 6, accentCol));
        faces = faces.concat(generateBlockFaces(28, 25, 28, 6, 40, 6, accentCol));
      } else {
        // Standard Chair
        faces = faces.concat(generateBlockFaces(0, -5, 0, 50, 8, 50, mainCol));
        faces = faces.concat(generateBlockFaces(0, -35, -21, 50, 50, 8, cushionCol));
        faces = faces.concat(generateBlockFaces(-20, 25, -20, 5, 50, 5, accentCol));
        faces = faces.concat(generateBlockFaces(20, 25, -20, 5, 50, 5, accentCol));
        faces = faces.concat(generateBlockFaces(-20, 25, 20, 5, 50, 5, accentCol));
        faces = faces.concat(generateBlockFaces(20, 25, 20, 5, 50, 5, accentCol));
      }
    } else if (item.category === "Table") {
      if (title.includes("coffee")) {
        // Low coffee table
        faces = faces.concat(generateBlockFaces(0, 12, 0, 110, 8, 110, mainCol));
        faces = faces.concat(generateBlockFaces(-46, 28, -46, 12, 28, 12, accentCol));
        faces = faces.concat(generateBlockFaces(46, 28, -46, 12, 28, 12, accentCol));
        faces = faces.concat(generateBlockFaces(-46, 28, 46, 12, 28, 12, accentCol));
        faces = faces.concat(generateBlockFaces(46, 28, 46, 12, 28, 12, accentCol));
      } else if (title.includes("side") || title.includes("end")) {
        // Tall end table
        faces = faces.concat(generateBlockFaces(0, -10, 0, 55, 6, 55, mainCol));
        faces = faces.concat(generateBlockFaces(-21, 22, -21, 5, 68, 5, accentCol));
        faces = faces.concat(generateBlockFaces(21, 22, -21, 5, 68, 5, accentCol));
        faces = faces.concat(generateBlockFaces(-21, 22, 21, 5, 68, 5, accentCol));
        faces = faces.concat(generateBlockFaces(21, 22, 21, 5, 68, 5, accentCol));
      } else {
        // Large Dining Table
        faces = faces.concat(generateBlockFaces(0, -30, 0, 160, 8, 110, mainCol));
        faces = faces.concat(generateBlockFaces(-72, 10, -48, 10, 72, 10, accentCol));
        faces = faces.concat(generateBlockFaces(72, 10, -48, 10, 72, 10, accentCol));
        faces = faces.concat(generateBlockFaces(-72, 10, 48, 10, 72, 10, accentCol));
        faces = faces.concat(generateBlockFaces(72, 10, 48, 10, 72, 10, accentCol));
      }
    } else if (item.category === "Lamp") {
      if (title.includes("ceiling") || title.includes("pendant") || title.includes("chandelier")) {
        // Ceiling hanging lamp
        faces = faces.concat(generateBlockFaces(0, -80, 0, 2, 80, 2, "0, 0%, 20%"));
        faces = faces.concat(generateBlockFaces(0, -32, 0, 48, 16, 48, "45, 90%, 65%"));
      } else if (title.includes("table") || title.includes("desk")) {
        // Small desk lamp
        faces = faces.concat(generateBlockFaces(-10, 20, 0, 4, 45, 4, "0, 0%, 40%"));
        faces = faces.concat(generateBlockFaces(0, -5, 0, 16, 12, 16, "200, 75%, 60%"));
        faces = faces.concat(generateBlockFaces(-10, 42, 0, 20, 4, 20, "0, 0%, 20%"));
      } else {
        // Tall floor lamp
        faces = faces.concat(generateBlockFaces(0, -10, 0, 4, 110, 4, "0, 0%, 35%"));
        faces = faces.concat(generateBlockFaces(0, -75, 0, 32, 25, 32, "45, 90%, 75%"));
        faces = faces.concat(generateBlockFaces(0, 46, 0, 35, 6, 35, "0, 0%, 20%"));
      }
    } else if (item.category === "Bed") {
      faces = faces.concat(generateBlockFaces(0, 10, 10, 140, 30, 170, mainCol));
      faces = faces.concat(generateBlockFaces(0, -35, -78, 140, 60, 12, accentCol));
      faces = faces.concat(generateBlockFaces(-35, -10, -50, 45, 10, 30, "0, 0%, 95%"));
      faces = faces.concat(generateBlockFaces(35, -10, -50, 45, 10, 30, "0, 0%, 95%"));
    } else {
      faces = faces.concat(generateBlockFaces(0, 0, 0, 70, 70, 70, mainCol));
    }

    return faces;
  };

  // Core 3D Rendering Canvas Drawing Pipeline
  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Directional Lighting vector (top-right-front light source)
    const lightDir = { x: 0.5, y: -0.8, z: 0.3 };
    const len = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
    const normLight = { x: lightDir.x / len, y: lightDir.y / len, z: lightDir.z / len };

    // 1. Gather all faces from all active items
    let allSceneFaces: Face[] = [];

    activeItems.forEach((item) => {
      const itemFaces = get3DItemFaces(item);
      const isSelected = item.id === selectedItemId;

      // Project vertices to Item Center & rotate
      const transformedFaces = itemFaces.map((face) => {
        const rotatedVertices = face.vertices.map((v) => {
          // 1. Scale
          let p = { x: v.x * item.scale, y: v.y * item.scale, z: v.z * item.scale };
          // 2. Rotate Y
          p = rotateY(p, item.rotY);
          // 3. Rotate X (tilt angle)
          p = rotateX(p, item.rotX);
          return p;
        });

        // Calculate face normal rotation
        let rotNormal = rotateY(face.normal, item.rotY);
        rotNormal = rotateX(rotNormal, item.rotX);

        // Average Z calculation for depth sorting (Painter's algorithm)
        const itemScreenZ = rotatedVertices.reduce((sum, v) => sum + v.z, 0) / rotatedVertices.length;

        // Binds the screen coordinate calculations
        const screenVerts = rotatedVertices.map((v) => {
          const zOffset = 450; // Camera distance
          const perspective = zOffset / (zOffset + v.z);
          return {
            x: item.x * width / 100 + v.x * perspective,
            y: item.y * height / 100 + v.y * perspective,
            z: v.z,
          };
        });

        // Calculate Flat Shading
        const dot = rotNormal.x * normLight.x + rotNormal.y * normLight.y + rotNormal.z * normLight.z;
        const shading = 0.5 + 0.5 * Math.max(0, dot); // Range 0.5 to 1.0

        // Build shaded HSL color string
        const hslParts = face.color.split(", ");
        const hue = hslParts[0];
        const sat = hslParts[1];
        const baseLightness = parseInt(hslParts[2]) || 45;
        const shadedLightness = Math.round(baseLightness * shading);
        const shadedColor = `hsl(${hue}, ${sat}, ${shadedLightness}%)`;

        return {
          vertices: screenVerts as Point3D[],
          color: shadedColor,
          normal: rotNormal,
          avgZ: itemScreenZ + (item.y * 10), // Adding Y bias so items placed lower on the ground draw in front
          isSelected,
        };
      });

      allSceneFaces = allSceneFaces.concat(transformedFaces as any);
    });

    // 2. Sort all faces from Back to Front (Z-sorting)
    allSceneFaces.sort((a, b) => (b.avgZ || 0) - (a.avgZ || 0));

    // 3. Render all polygons
    allSceneFaces.forEach((face: any) => {
      if (face.vertices.length < 3) return;

      ctx.beginPath();
      ctx.moveTo(face.vertices[0].x, face.vertices[0].y);
      for (let i = 1; i < face.vertices.length; i++) {
        ctx.lineTo(face.vertices[i].x, face.vertices[i].y);
      }
      ctx.closePath();

      // Solid Shaded Fill
      ctx.fillStyle = face.color;
      ctx.fill();

      // Wireframe Outline
      ctx.strokeStyle = face.isSelected ? "#B88E2F" : "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = face.isSelected ? 2.0 : 0.8;
      ctx.stroke();
    });

    // 4. Draw selection ring indicators around active item base
    activeItems.forEach((item) => {
      if (item.id === selectedItemId) {
        ctx.beginPath();
        ctx.ellipse(
          item.x * width / 100,
          item.y * height / 100 + (25 * item.scale), // Base offset
          45 * item.scale,
          15 * item.scale,
          0,
          0,
          2 * Math.PI
        );
        ctx.strokeStyle = "#B88E2F";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
      }
    });
  };

  // Canvas Mouse interaction (dragging & selection)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const canvasX = ((clientX - rect.left) / rect.width) * 100;
    const canvasY = ((clientY - rect.top) / rect.height) * 100;

    // Detect click hit-test (which item is closest to click coordinate)
    let clickedItemId: string | null = null;
    let minDistance = 12; // radius threshold in percent

    activeItems.forEach((item) => {
      const dx = item.x - canvasX;
      const dy = item.y - canvasY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        clickedItemId = item.id;
      }
    });

    setSelectedItemId(clickedItemId);

    if (clickedItemId) {
      const matched = activeItems.find((i) => i.id === clickedItemId);
      if (matched) {
        dragInfo.current = {
          isDragging: true,
          itemId: clickedItemId,
          startX: clientX,
          startY: clientY,
          startLeft: matched.x,
          startTop: matched.y,
        };
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragInfo.current.isDragging || !dragInfo.current.itemId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragInfo.current.startX;
    const deltaY = clientY - dragInfo.current.startY;

    const pctX = (deltaX / rect.width) * 100;
    const pctY = (deltaY / rect.height) * 100;

    let newX = dragInfo.current.startLeft + pctX;
    let newY = dragInfo.current.startTop + pctY;

    // Boundary constraints (10% to 90%)
    newX = Math.max(10, Math.min(90, newX));
    newY = Math.max(15, Math.min(85, newY));

    setActiveItems((prev) =>
      prev.map((item) =>
        item.id === dragInfo.current.itemId ? { ...item, x: newX, y: newY } : item
      )
    );
  };

  const handleCanvasMouseUp = () => {
    dragInfo.current.isDragging = false;
    dragInfo.current.itemId = null;
  };

  const updateItemProperty = (id: string, updates: Partial<Placed3DItem>) => {
    setActiveItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (id: string) => {
    setActiveItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const clearCanvas = () => {
    setActiveItems([]);
    setSelectedItemId(null);
  };

  const categories = ["All", "Sofa", "Chair", "Table", "Lamp", "Bed"];
  const filteredProducts = activeTab === "All"
    ? products
    : products.filter((p) => getProductCategory(p) === activeTab);

  const selectedItem = activeItems.find((i) => i.id === selectedItemId);

  return (
    <section className="w-full bg-white min-h-[90vh]" id={renderId || undefined}>
      {/* Title Header Banner */}
      <div className="relative w-full h-[220px] bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200')] bg-cover bg-center flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <h1 className="text-[40px] font-semibold text-black font-poppins mb-1">{t('RoomVisualizer-Interactive3dRoomStyling')}</h1>
          <p className="text-black/60 font-poppins text-[15px]">{t('RoomVisualizer-RotateScalePositionAnd')}</p>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 py-[60px]">
        <div className={styles.gridContainer}>
          
          {/* Left Column: 3D Viewport Workspace */}
          <div className="flex flex-col gap-5">
            
            {/* Toolbar Settings */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#F4F5F7] rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-black/60 font-poppins">{t('RoomVisualizer-SelectRoomScene')}</span>
                {ROOM_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    onClick={() => setBgImage(tmpl.url)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border font-poppins transition-all ${
                      bgImage === tmpl.url
                        ? "bg-[#B88E2F] text-white border-[#B88E2F]"
                        : "bg-white text-black border-gray-200 hover:border-[#B88E2F]"
                    }`}
                  >
                    {tmpl.name.split(" ")[1]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-[#B88E2F] rounded-md cursor-pointer text-xs font-semibold font-poppins transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t('RoomVisualizer-UploadScene')}
                  <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                </label>

                <button
                  onClick={clearCanvas}
                  className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-md text-xs font-semibold font-poppins transition-colors"
                >
                  {t('RoomVisualizer-ClearSandbox')}
                </button>
              </div>
            </div>

            {/* Interactive 3D Canvas Layer */}
            <div
              className={styles.canvasWrapper}
              style={{ backgroundImage: `url(${bgImage})` }}
            >
              <canvas
                ref={canvasRef}
                width={780}
                height={480}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
                className={styles.renderCanvas}
              />

              {/* No Items Help Overlay */}
              {activeItems.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10 select-none">
                  <div className="p-6 bg-white/95 backdrop-blur-sm rounded-lg text-center shadow-lg max-w-[340px]">
                    <span className="block text-[#B88E2F] font-bold font-poppins text-lg mb-2">{t('RoomVisualizer-3dDesignPlayground')}</span>
                    <span className="text-xs font-poppins text-black/60 leading-relaxed block">
                      {t('RoomVisualizer-ChooseARoomBackground')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected 3D Object Editor Controls Panel */}
            {selectedItem && (
              <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 font-poppins">
                <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                  <h4 className="font-semibold text-lg text-black">{selectedItem.title}</h4>
                  <span className="text-xs text-[#B88E2F] font-bold">{t('Global-Category1')} {selectedItem.category} {t('RoomVisualizer-3dMeshModel')}</span>
                  
                  {/* Color Selector */}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs font-semibold text-black/60">{t('RoomVisualizer-MaterialTexture')}</span>
                    <select
                      value={selectedItem.material}
                      onChange={(e) => {
                        const m = MATERIALS.find((x) => x.value === e.target.value);
                        updateItemProperty(selectedItem.id, {
                          material: e.target.value,
                          materialName: m ? m.name : selectedItem.materialName,
                        });
                      }}
                      className="text-xs p-1.5 border border-gray-200 rounded-md focus:border-[#B88E2F] focus:outline-none"
                    >
                      {MATERIALS.map((mat) => (
                        <option key={mat.name} value={mat.value}>
                          {mat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3D Sliders and Scale Controls */}
                <div className="flex flex-col gap-4">
                  {/* Rotation Slider */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-black/60 w-[90px]">{t('RoomVisualizer-YRotation')}</span>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="5"
                      value={selectedItem.rotY}
                      onChange={(e) => updateItemProperty(selectedItem.id, { rotY: parseInt(e.target.value) })}
                      className="accent-[#B88E2F] cursor-pointer flex-grow"
                    />
                    <span className="text-xs font-bold text-black/80 w-[45px] text-right">{selectedItem.rotY}°</span>
                  </div>

                  {/* Pitch / Tilt Slider */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-black/60 w-[90px]">{t('RoomVisualizer-XTiltAngle')}</span>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="2"
                      value={selectedItem.rotX}
                      onChange={(e) => updateItemProperty(selectedItem.id, { rotX: parseInt(e.target.value) })}
                      className="accent-[#B88E2F] cursor-pointer flex-grow"
                    />
                    <span className="text-xs font-bold text-black/80 w-[45px] text-right">{selectedItem.rotX}°</span>
                  </div>

                  {/* Scaling Slider */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-black/60 w-[90px]">{t('RoomVisualizer-ScaleSize')}</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={selectedItem.scale}
                      onChange={(e) => updateItemProperty(selectedItem.id, { scale: parseFloat(e.target.value) })}
                      className="accent-[#B88E2F] cursor-pointer flex-grow"
                    />
                    <span className="text-xs font-bold text-black/80 w-[45px] text-right">{Math.round(selectedItem.scale * 100)}%</span>
                  </div>

                  {/* Remove Button */}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => removeItem(selectedItem.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-bold transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {t('RoomVisualizer-DeletePlacedObject')}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Right Column: Dynamic Sidebar Catalog */}
          <div className="flex flex-col border border-gray-200 rounded-lg p-5 max-h-[640px] overflow-hidden bg-[#FAF9F5]/40 backdrop-blur-[2px]">
            <h3 className="text-xl font-bold font-poppins text-black mb-3">{t('RoomVisualizer-3dFurnitureCatalog')}</h3>
            
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-gray-100 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full font-poppins whitespace-nowrap transition-colors ${
                    activeTab === cat
                      ? "bg-[#B88E2F] text-white"
                      : "bg-[#F4F5F7] text-black/60 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products catalog list */}
            <div className="flex-grow overflow-y-auto pr-1 grid grid-cols-2 gap-3 scrollbar-thin">
              {loading ? (
                <div className="col-span-2 text-center py-10 text-black/40 font-poppins text-sm">
                  {t('RoomVisualizer-LoadingCatalog')}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-black/40 font-poppins text-sm">
                  {t('RoomVisualizer-No3dTemplatesIn')}
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => addItemToCanvas(prod)}
                    className="flex flex-col bg-white border border-gray-200 hover:border-[#B88E2F] p-3 rounded-lg shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="w-full h-[90px] mb-2 bg-[#F4F5F7] rounded overflow-hidden flex items-center justify-center relative">
                      <img
                        src={prod.mainImage}
                        alt={prod.title}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=150";
                        }}
                      />
                      <span className="absolute bottom-1 right-1 bg-[#B88E2F]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {t('RoomVisualizer-3d')}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#3A3A3A] truncate font-poppins">{prod.title}</span>
                    <span className="text-xs font-medium text-[#B88E2F] font-poppins">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
