import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar fuentes si es necesario, pero usaremos las estándar por ahora para evitar problemas de carga
// @react-pdf/renderer usa Helvetica por defecto

const styles = StyleSheet.create({
  page: {
    padding: '20mm',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  projectInfo: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  projectValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 10,
    color: '#64748b',
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 8,
    borderLeft: '4pt solid #2563eb',
    paddingLeft: 8,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
  },
  tableCellLabel: {
    flex: 2,
    paddingLeft: 10,
    fontSize: 10,
  },
  tableCellValue: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 10,
    fontWeight: 'medium',
  },
  boldRow: {
    backgroundColor: '#f8fafc',
  },
  boldText: {
    fontWeight: 'bold',
  },
  totalRow: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    minHeight: 40,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  insumoHeader: {
    backgroundColor: '#f0fdf4',
  },
  insumoRow: {
    borderBottomColor: '#d1fae5',
  },
  insumoText: {
    color: '#065f46',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTop: '1pt solid #e2e8f0',
  },
  ctaBox: {
    backgroundColor: '#eff6ff',
    border: '1pt solid #bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  ctaTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  ctaText: {
    fontSize: 9,
    color: '#2563eb',
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  source: {
    fontSize: 8,
    color: '#94a3b8',
  },
  disclaimer: {
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'right',
    maxWidth: 200,
  }
});

interface PDFReportProps {
  calc: any;
  nombreProyecto: string;
  indirectos: number | '';
  financiamiento: number | '';
  utilidad: number | '';
  insumos: any[];
  moneda: string;
}

export const PDFReport: React.FC<PDFReportProps> = ({ 
  calc, 
  nombreProyecto, 
  indirectos, 
  financiamiento, 
  utilidad, 
  insumos,
  moneda 
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const dateStr = new Date().toLocaleDateString('es-MX', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Estimación de Honorarios</Text>
          <View style={styles.headerRow}>
            <View style={styles.projectInfo}>
              <Text style={styles.label}>Proyecto:</Text>
              <Text style={styles.projectValue}>{nombreProyecto || 'Proyecto General'}</Text>
            </View>
            <Text style={styles.date}>Fecha de Emisión: {dateStr}</Text>
          </View>
        </View>

        {/* RESUMEN DE INVERSIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Inversión</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCellLabel, styles.boldText]}>Concepto de Costo</Text>
              <Text style={[styles.tableCellValue, styles.boldText]}>Importe Parcial</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Mano de Obra Directa</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(calc.costoManoObra)}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Insumos y Gastos Directos</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(calc.costoInsumosTotal)}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Indirectos ({indirectos}%)</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(calc.montoIndirectos)}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Financiamiento ({financiamiento}%)</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(calc.montoFinanciamiento)}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Utilidad ({utilidad}%)</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(calc.montoUtilidad)}</Text>
            </View>
            
            <View style={[styles.tableRow, styles.boldRow]}>
              <Text style={[styles.tableCellLabel, styles.boldText]}>Subtotal (Antes de IVA)</Text>
              <Text style={[styles.tableCellValue, styles.boldText]}>{formatCurrency(calc.precioNeto)}</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>IVA ({calc.ivaPct}%)</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(calc.iva)}</Text>
            </View>
            
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCellLabel, styles.totalLabel]}>TOTAL FINAL</Text>
              <Text style={[styles.tableCellValue, styles.totalValue]}>{formatCurrency(calc.totalCobrar)}</Text>
            </View>
          </View>
        </View>

        {/* DETALLE DE INSUMOS */}
        {insumos.some(i => i.descripcion) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { borderLeftColor: '#10b981' }]}>Detalle de Insumos</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.insumoHeader]}>
                <Text style={[styles.tableCellLabel, styles.boldText, styles.insumoText]}>Descripción del Concepto</Text>
                <Text style={[styles.tableCellValue, styles.boldText, styles.insumoText]}>Costo Unitario</Text>
              </View>
              {insumos.filter(i => i.descripcion).map((insumo, idx) => (
                <View key={idx} style={[styles.tableRow, styles.insumoRow]}>
                  <Text style={[styles.tableCellLabel, styles.insumoText]}>{insumo.descripcion}</Text>
                  <Text style={[styles.tableCellValue, styles.insumoText]}>{formatCurrency(Number(insumo.costo) || 0)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>¿Necesitas presupuestos más complejos?</Text>
            <Text style={styles.ctaText}>Cotizador Constructor PRO en romeleliseo.com/cotizadorpro</Text>
          </View>
          
          <View style={styles.footerBottom}>
            <View>
              <Text style={styles.source}>Generado en romeleliseo.com/cuantocobro</Text>
              <Text style={[styles.source, { marginTop: 2 }]}>Herramienta para profesionales de la construcción</Text>
            </View>
            <Text style={styles.disclaimer}>
              Este reporte es una estimación técnica basada en los parámetros proporcionados por el usuario. No constituye una oferta vinculante hasta ser validada por un profesional.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
