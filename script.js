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

  // Encabezado de alta resolución (doble tamaño)
  const encabezadoBase64 = await generarEncabezadoConCursoHD(curso);

  const pdf = new jsPDF();

  for (let i = 0; i < archivos.length; i++) {
    if (i > 0) pdf.addPage();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Encabezado visual con texto integrado, escalado a tamaño deseado
    const encabezadoAltura = 30;
    pdf.addImage(encabezadoBase64, 'PNG', 10, 10, pageWidth - 20, encabezadoAltura);

    // Imagen del usuario, optimizada
    const imagenBase64 = await toCompressedBase64(archivos[i], 1024, 1024, 0.85);
    const imgProps = pdf.getImageProperties(imagenBase64);

    const maxAncho = pageWidth - 20;
    const maxAlto = pageHeight - (encabezadoAltura + 30 + 20);

    let ancho = imgProps.width;
    let alto = imgProps.height;

    // Escalado proporcional (por si la imagen sigue muy grande)
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

    pdf.addImage(imagenBase64, 'JPEG', x, y, ancho, alto, undefined, 'FAST'); // 'FAST' para compresión

    // Pie de página
    pdf.setFontSize(10);
    pdf.text(`${i + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  pdf.save(`Evidencia_${curso}.pdf`);
}

// Comprime y redimensiona la imagen antes de insertarla al PDF
async function toCompressedBase64(file, maxWidth, maxHeight, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = function () {
        let { width, height } = img;
        let scale = Math.min(maxWidth / width, maxHeight / height, 1);
        let newWidth = width * scale;
        let newHeight = height * scale;

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // JPEG para compresión (PDF admite mejor JPEG que PNG)
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = err => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

// Encabezado de alta definición (doble resolución)
async function generarEncabezadoConCursoHD(curso) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = 'encabezado.png'; // Usa imagen grande si puedes

    img.onload = function () {
      // Escalamos el canvas al doble de tamaño para más nitidez
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Estilo del texto del curso
      ctx.font = `bold ${40}px Arial`; // Doble tamaño de fuente
      ctx.fillStyle = "#0c2c4a";
      ctx.textAlign = "left";

      // Ubicación precisa del texto sobre la línea (ajusta según tu encabezado)
      const x = 900 * scale / 1.5; // Ajusta este valor
      const y = 84 * scale;        // Ajusta este valor

      ctx.fillText(curso, x, y);

      resolve(canvas.toDataURL("image/png", 1.0)); // PNG máxima calidad
    };

    img.onerror = function () {
      reject("No se pudo cargar la imagen del encabezado.");
    };
  });
}
