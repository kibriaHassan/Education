export async function downloadSheets(
  nodes: HTMLElement[],
  filename: string,
  onProgress?: (current: number, total: number) => void,
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
  await document.fonts.ready
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })

  for (let index = 0; index < nodes.length; index += 1) {
    onProgress?.(index + 1, nodes.length)
    const node = nodes[index]
    if (!node) continue
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: '#fffdf8',
      useCORS: true,
      logging: false,
      width: 794,
      height: 1123,
    })
    const image = canvas.toDataURL('image/jpeg', 0.92)
    if (index > 0) pdf.addPage()
    pdf.addImage(image, 'JPEG', 0, 0, 210, 297)
  }

  pdf.save(filename)
}
