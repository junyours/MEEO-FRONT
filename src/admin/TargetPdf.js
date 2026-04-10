import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import letterheadTemplate from '../assets/report_template/letterhead_template.jpg';

// Government Header Function
const addGovernmentHeader = (doc, pageWidth, margin = 20) => {
  let yPosition = 10;
  
  // Government Header with Logos matching the design
  try {
    // Add Municipality logo on the left (circular logo with blue, red, yellow, black elements)
    doc.addImage('/logo_Opol.png', 'PNG', margin, yPosition, 30, 30);
    
    // Add MEE logo on the right (predominantly red and yellow circular logo)
    doc.addImage('/logo_meeo.png', 'PNG', pageWidth - margin - 30, yPosition, 30, 30);
  } catch (error) {
    console.log('Logos not found:', error);
  }
  
  yPosition += 15;
  
  // Centered Government Header - matching exact requirements
  doc.setFont('calibri', 'bold');
  doc.setFontSize(12.3);
  doc.text('Province of Misamis Oriental', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  doc.setFontSize(12.3);
  doc.text('Municipality of Opol', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  doc.setFontSize(12.5);
  doc.text('OFFICE OF THE MUNICIPAL ECONOMIC ENTERPRISE', pageWidth / 2, yPosition, { align: 'center' });
  
  // Add double lines below OFFICE OF THE MUNICIPAL ECONOMIC ENTERPRISE
  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
  yPosition += 2;
  doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
  doc.setLineWidth(0); // Reset to default line width
  
  yPosition += 12;
  
  return yPosition; // Return the next y position for content
};

// Helper: format number with 2 decimals and comma separators, replace 0 with "-"
const formatNumber = (num) => {
  const value = Number(num) || 0;
  return value === 0 ? "-" : value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// -------------------- TARGET REPORT PDF --------------------
export const generateTargetReportPDF = async (year, tableData, pieChartRef, overallChartRef) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Add letterhead template as background
  try {
    doc.addImage(letterheadTemplate, 'JPEG', 0, 0, pageWidth, pageHeight);
  } catch (error) {
    // Letterhead template not found, continuing without it
  }
  
  // Add government header
  let yOffset = 30; // Start position after letterhead, moved significantly up
  
  // Add title after header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Target Report - ${year}`, pageWidth / 2, yOffset + 25, { align: 'center' });
  yOffset += 45; // Increased spacing after title to create double spacing with the table

  // Function to render a chart div
  const renderChart = async (chartRef) => {
    if (!chartRef || !chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 480;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      const centeredX = (doc.internal.pageSize.width - pdfWidth) / 2;
      doc.addImage(imgData, "PNG", centeredX, yOffset, pdfWidth, imgHeight);
      yOffset += imgHeight + 20; // space after chart
    } catch (error) {
      console.warn("Chart rendering failed:", error);
    }
  };

  // ✅ Render Pie Chart first
  await renderChart(pieChartRef);

  // ✅ Render Overall Progress Chart below pie chart
  await renderChart(overallChartRef);

  // -------------------- TABLE DATA --------------------
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const head = [
    ["Department", "Annual Target", ...months, "Total Collection", "Progress (%)"],
  ];

  const body = tableData.map((item) => {
    const target = Number(item.annual_target) || 0;
    const collected = Number(item.total_collection) || 0;
    const progress = target > 0 ? ((collected / target) * 100).toFixed(2) + "%" : "-";
    return [
      item.module,
      formatNumber(target),
      ...months.map((_, i) => formatNumber(item.monthly?.[i + 1])),
      formatNumber(collected),
      progress,
    ];
  });

  // ✅ TOTALS (Annual, Monthly, Collection, Progress)
  const totalTarget = tableData.reduce(
    (sum, r) => sum + (Number(r.annual_target) || 0),
    0
  );
  const totalCollection = tableData.reduce(
    (sum, r) => sum + (Number(r.total_collection) || 0),
    0
  );
  const totalProgress =
    totalTarget > 0
      ? ((totalCollection / totalTarget) * 100).toFixed(2) + "%"
      : "-";

  // 🔽 NEW: vertical monthly totals (same logic as AntD table summary)
  const monthlyTotals = months.map((_, idx) => {
    const monthIndex = idx + 1; // monthly is 1-based
    return tableData.reduce((sum, row) => {
      const value = Number(row.monthly?.[monthIndex] || 0);
      return sum + value;
    }, 0);
  });

  // 🔽 TOTAL ROW using monthlyTotals instead of "-" per month
  const totalRow = [
    "TOTAL",
    formatNumber(totalTarget),
    ...monthlyTotals.map((value) => formatNumber(value)),
    formatNumber(totalCollection),
    totalProgress,
  ];
  body.push(totalRow);

  // ✅ ADD TABLE WITH TOTAL STYLING (adjusted positioning to avoid background collision)
  autoTable(doc, {
    startY: yOffset + 25, // Additional spacing to create double spacing between title and table
    margin: { left: 60, right: 60 }, // Reduced margins to increase table size and center it
    tableWidth: pageWidth - 120, // Increased table width for better utilization of space
    head,
    body,
    theme: "grid",
    styles: {
      fontSize: 9, // Increased font size for better readability
      font: "helvetica",
      fillColor: [255, 255, 255], // White background to ensure readability
      textColor: [0, 0, 0],
      halign: "center",
      valign: "middle",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 4, // Increased cell padding for larger appearance
    },
    headStyles: {
      fillColor: [245, 245, 245], // Light gray background for header
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240]; // Light gray for total row
      }
    },
  });

  // Save PDF
  doc.save(`Target_Report_${year}.pdf`);
};
