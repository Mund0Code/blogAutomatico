import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  console.log("🤖 Iniciando la generación de un nuevo post...");

  // 1. Generar un tema para el artículo
  const topicPrompt =
    "Genera un título atractivo y corto para un artículo de blog sobre un tema de actualidad en tecnología o programación. Por ejemplo: 'Novedades de JavaScript en 2025' o 'Introducción a la computación cuántica'. Dame solo el título, sin comillas ni texto adicional.";
  const topicResponse = await groq.chat.completions.create({
    messages: [{ role: "user", content: topicPrompt }],
    model: "llama3-8b-8192",
  });
  const title = topicResponse.choices[0]?.message?.content.trim();

  if (!title) {
    console.error("No se pudo generar un título.");
    return;
  }
  console.log(`✨ Título generado: ${title}`);

  // 2. Generar el contenido del artículo
  const contentPrompt = `Escribe un artículo de blog completo en español sobre el tema: "${title}". El artículo debe tener una introducción, varios párrafos de desarrollo y una conclusión. Utiliza formato Markdown. Incluye encabezados (##) para las secciones y usa negritas para términos importantes. El tono debe ser informativo y accesible.`;
  const contentResponse = await groq.chat.completions.create({
    messages: [{ role: "user", content: contentPrompt }],
    model: "llama3-70b-8192", // Usamos un modelo más potente para el contenido
  });
  const content = contentResponse.choices[0]?.message?.content.trim();

  if (!content) {
    console.error("No se pudo generar el contenido.");
    return;
  }
  console.log("✅ Contenido del artículo generado.");

  // 3. Crear el archivo del post en formato Markdown
  const today = new Date();
  const date = today.toISOString().split("T")[0]; // Formato YYYY-MM-DD
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
  const filePath = path.join("src/content/blog", `${slug}.md`);

  const fileContent = `---
title: "${title}"
pubDate: ${date}
description: "Un resumen del artículo sobre ${title}."
author: "Blog Automatizado"
tags: ["tecnología", "programación", "ia"]
---

${content}
`;

  fs.writeFileSync(filePath, fileContent);
  console.log(`💾 Nuevo post guardado en: ${filePath}`);
}

main().catch(console.error);
