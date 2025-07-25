async function generarPDF() {
  const { jsPDF } = window.jspdf;
  const curso = document.getElementById('curso').value;
  const archivos = document.getElementById('imagenes').files;

  if (!curso) {
    alert("Por favor selecciona un curso.");
    return;
  }
  if (archivos.length === 0) {
    alert("Por favor sube al menos una imagen.");
    return;
  }

  // Crea imagen del encabezado con el texto del curso integrado
  const encabezadoBase64 = await generarEncabezadoConCurso(curso);

  const pdf = new jsPDF();

  for (let i = 0; i < archivos.length; i++) {
    if (i > 0) pdf.addPage();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Encabezado visual con texto integrado
    const encabezadoAltura = 30;
    pdf.addImage(encabezadoBase64, 'PNG', 10, 10, pageWidth - 20, encabezadoAltura);

    // Imagen del usuario
    const imagenBase64 = await toBase64(archivos[i]);
    const imgProps = pdf.getImageProperties(imagenBase64);

    const maxAncho = pageWidth - 20;
    const maxAlto = pageHeight - (encabezadoAltura + 30 + 20);

    let ancho = imgProps.width;
    let alto = imgProps.height;

    if (ancho > maxAncho) {
      alto = (maxAncho / ancho) * alto;
      ancho = maxAncho;
    }
    if (alto > maxAlto) {
      ancho = (maxAlto / alto) * ancho;
      alto = maxAlto;
    }

    const x = (pageWidth - ancho) / 2;
    const y = encabezadoAltura + 20;

    pdf.addImage(imagenBase64, 'JPEG', x, y, ancho, alto);

    // Pie de página
    pdf.setFontSize(10);
    pdf.text(`${i + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  pdf.save(`Evidencia_${curso}.pdf`);
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

// 🖼️ Reemplaza texto "CURSO: ___" por el curso real usando canvas
async function generarEncabezadoConCurso(curso) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = 'encabezado.png'; // Asegúrese de tener la imagen en esta ruta o cambiar el nombre si es diferente

    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Estilo del texto del curso
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#0c2c4a";
      ctx.textAlign = "left ";

      // Ubicación precisa del texto sobre la línea
      const x = 600; // ajustar según el encabezado exacto
      const y = 84;  // ajustar según el encabezado exacto

      ctx.fillText(curso, x, y);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = function () {
      reject("No se pudo cargar la imagen del encabezado.");
    };
  });
}
