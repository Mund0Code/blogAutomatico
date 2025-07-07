import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { createApi } from "unsplash-js"; // Importamos la librería de Unsplash

// Configuración de la API de Groq para texto
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Configuración de la API de Unsplash para imágenes
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
});

async function main() {
  console.log("🤖 Iniciando la generación de un nuevo post...");

  // 1. Generar un tema para el artículo
  const topicPrompt =
    "Genera un título atractivo y corto para un artículo de blog sobre un tema de actualidad en tecnología o programación. Dame solo el título, sin comillas ni texto adicional.";
  const topicResponse = await groq.chat.completions.create({
    messages: [{ role: "user", content: topicPrompt }],
    model: "llama3-8b-8192",
  });
  const title = topicResponse.choices[0]?.message?.content.trim();

  if (!title) {
    console.error("No se pudo generar un título.");
    return process.exit(1);
  }
  console.log(`✨ Título generado: ${title}`);

  // 2. Generar el contenido del artículo
  const contentPrompt = `Escribe un artículo de blog completo en español sobre el tema: "${title}". El artículo debe tener una introducción, varios párrafos de desarrollo y una conclusión. Utiliza formato Markdown. Incluye encabezados (##) para las secciones y usa negritas para términos importantes. El tono debe ser informativo y accesible.`;
  const contentResponse = await groq.chat.completions.create({
    messages: [{ role: "user", content: contentPrompt }],
    model: "llama3-70b-8192",
  });
  const content = contentResponse.choices[0]?.message?.content.trim();

  if (!content) {
    console.error("No se pudo generar el contenido.");
    return process.exit(1);
  }
  console.log("✅ Contenido del artículo generado.");

  // 3. ¡NUEVO! Buscar una imagen en Unsplash
  let imageUrl = "";
  try {
    console.log(`🖼️  Buscando imagen para: "${title}"`);
    const imageResult = await unsplash.search.getPhotos({
      query: title, // Usamos el título como término de búsqueda
      page: 1,
      perPage: 1,
      orientation: "landscape",
    });

    if (imageResult.response && imageResult.response.results.length > 0) {
      imageUrl = imageResult.response.results[0].urls.regular;
      console.log(`✅ Imagen encontrada: ${imageUrl}`);
    } else {
      console.log("⚠️ No se encontró una imagen, se usará una por defecto.");
      imageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475"; // Una imagen genérica de tecnología
    }
  } catch (error) {
    console.error("Error al buscar la imagen:", error);
    imageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475";
  }

  // 4. Crear el archivo del post en formato Markdown
  const today = new Date();
  const date = today.toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
  const filePath = path.join("src/content/blog", `${slug}.md`);

  // Añadimos el campo 'heroImage' al frontmatter
  const fileContent = `---
title: "${title}" pubDate: ${date} description: "Un resumen del artículo sobre title."author:"BlogAutomatizado"heroImage:"{imageUrl}" tags: ["tecnología", "programación", "ia"]
${content}
`;

  fs.writeFileSync(filePath, fileContent);
  console.log(`💾 Nuevo post guardado en: ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
