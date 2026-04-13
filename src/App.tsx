import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Info, Calculator, ArrowRight, DollarSign, Clock, Briefcase, Percent, Globe, Plus, Trash2, Download, FileText, Save, X, ChevronUp, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pdf } from '@react-pdf/renderer';
import { PDFReport } from './components/PDFReport';

export default function App() {
  // Configuración Regional
  const [moneda, setMoneda] = useState<string>(() => localStorage.getItem('calc_moneda') || 'MXN');
  const [ivaPorcentaje, setIvaPorcentaje] = useState<number | ''>(16);

  // Datos Base
  const [salarioMensual, setSalarioMensual] = useState<number | ''>(() => {
    const saved = localStorage.getItem('calc_salarioMensual');
    return saved ? Number(saved) : '';
  });
  const [diasHabiles, setDiasHabiles] = useState<number | ''>(22);
  
  // Datos del Proyecto
  const [nombreProyecto, setNombreProyecto] = useState<string>('');
  const [horasProyecto, setHorasProyecto] = useState<number | ''>('');
  const [margenImprevistos, setMargenImprevistos] = useState<number>(20);
  const [insumos, setInsumos] = useState<{id: string, descripcion: string, costo: number | ''}[]>([
    { id: '1', descripcion: '', costo: '' }
  ]);

  // Factor de Sobrecosto
  const [indirectos, setIndirectos] = useState<number | ''>(15);
  const [financiamiento, setFinanciamiento] = useState<number | ''>(1);
  const [utilidad, setUtilidad] = useState<number | ''>(10);

  // PWA & Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [leadCapturado, setLeadCapturado] = useState<boolean>(() => {
    return localStorage.getItem('lead_capturado') === 'true';
  });

  const resultsRef = useRef<HTMLDivElement>(null);

  // Guardado automático en LocalStorage
  useEffect(() => {
    localStorage.setItem('calc_moneda', moneda);
  }, [moneda]);

  useEffect(() => {
    if (salarioMensual !== '') {
      localStorage.setItem('calc_salarioMensual', salarioMensual.toString());
    }
  }, [salarioMensual]);

  // Funciones para Insumos
  const addInsumo = () => {
    setInsumos([...insumos, { id: Math.random().toString(36).substring(2, 9), descripcion: '', costo: '' }]);
  };

  const removeInsumo = (id: string) => {
    setInsumos(insumos.filter(i => i.id !== id));
  };

  const updateInsumo = (id: string, field: 'descripcion' | 'costo', value: string | number) => {
    setInsumos(insumos.map(i => {
      if (i.id === id) {
        return { ...i, [field]: value === '' ? '' : (field === 'costo' ? Number(value) : value) };
      }
      return i;
    }));
  };

  // Cálculos
  const calc = useMemo(() => {
    const sm = Number(salarioMensual) || 0;
    const dh = Number(diasHabiles) || 1;
    const hp = Number(horasProyecto) || 0;
    const mi = Number(margenImprevistos) || 0;
    const ci = insumos.reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0);
    const ind = Number(indirectos) || 0;
    const fin = Number(financiamiento) || 0;
    const uti = Number(utilidad) || 0;
    const ivaPct = Number(ivaPorcentaje) || 0;

    const horasEfectivas = hp * (1 + mi / 100);
    const salarioDiario = sm / dh;
    const tarifaHora = salarioDiario / 8;
    const costoManoObra = tarifaHora * horasEfectivas;
    const subtotal = costoManoObra + ci;

    const montoIndirectos = subtotal * (ind / 100);
    const subtotal2 = subtotal + montoIndirectos;
    
    const montoFinanciamiento = subtotal2 * (fin / 100);
    const subtotal3 = subtotal2 + montoFinanciamiento;

    const montoUtilidad = subtotal3 * (uti / 100);
    
    const precioNeto = subtotal3 + montoUtilidad;
    const iva = precioNeto * (ivaPct / 100);
    const totalCobrar = precioNeto + iva;

    return {
      salarioDiario,
      tarifaHora,
      horasEfectivas,
      costoManoObra,
      costoInsumosTotal: ci,
      subtotal,
      montoIndirectos,
      montoFinanciamiento,
      montoUtilidad,
      precioNeto,
      iva,
      ivaPct,
      totalCobrar
    };
  }, [salarioMensual, diasHabiles, horasProyecto, margenImprevistos, insumos, indirectos, financiamiento, utilidad, ivaPorcentaje]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const handleDownloadClick = () => {
    if (leadCapturado) {
      generatePDF();
    } else {
      setShowEmailModal(true);
    }
  };

  const generatePDF = async () => {
    console.log('Generando PDF nativo...');
    
    // Sanitizar nombre de archivo
    const safeName = (nombreProyecto || 'Proyecto General').replace(/[/\\?%*:|"<>]/g, '-');
    const fileName = `Reporte-${safeName}-${new Date().getTime()}.pdf`;

    try {
      const blob = await pdf(
        <PDFReport 
          calc={calc} 
          nombreProyecto={nombreProyecto}
          indirectos={indirectos}
          financiamiento={financiamiento}
          utilidad={utilidad}
          insumos={insumos}
          moneda={moneda}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      console.log('PDF generado exitosamente');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
    }
  };

  const proceedWithDownload = async (shouldSend = true) => {
    if (shouldSend && (userData.email || userData.name)) {
      // Enviar a Google Apps Script
      try {
        fetch('https://script.google.com/macros/s/AKfycbyX1ukSwUaTDjlxchbEo6RBqYuuKq0XhsEhx1QLQUwLKdkbkFioQkWzwIPU0DArI6sl/exec', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            nombre: userData.name,
            email: userData.email
          }),
        }).catch(() => {});
        
        localStorage.setItem('lead_capturado', 'true');
        setLeadCapturado(true);
      } catch (err) {
        console.error('Error sending data:', err);
      }
    }
    
    setShowEmailModal(false);
    // Pequeño retardo para asegurar que el modal se cierre y la UI sea estable
    setTimeout(() => {
      generatePDF();
    }, 300);
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const chartData = [
    { name: 'Mano de Obra', value: calc.costoManoObra, color: '#3b82f6' },
    { name: 'Insumos', value: calc.costoInsumosTotal, color: '#10b981' },
    { name: 'Indirectos', value: calc.montoIndirectos, color: '#f59e0b' },
    { name: 'Financiamiento', value: calc.montoFinanciamiento, color: '#6366f1' },
    { name: 'Utilidad', value: calc.montoUtilidad, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Calculator size={24} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Calculadora de Honorarios</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Save size={14} />
            Guardado automático activo
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Configuración Regional */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="text-slate-600" size={20} />
                <h2 className="text-lg font-medium">Configuración Regional</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Moneda
                  </label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-white"
                  >
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="USD">USD - Dólar Estadounidense</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="CLP">CLP - Peso Chileno</option>
                    <option value="PEN">PEN - Sol Peruano</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Impuesto (IVA / VAT) %
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Percent className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ivaPorcentaje}
                      onChange={(e) => setIvaPorcentaje(e.target.value === '' ? '' : Number(e.target.value))}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Datos Base */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="text-blue-600" size={20} />
                <h2 className="text-lg font-medium">Datos Base</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Salario mensual deseado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={salarioMensual}
                      onChange={(e) => setSalarioMensual(e.target.value === '' ? '' : Number(e.target.value))}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ej. 30000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Días hábiles al mes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={diasHabiles}
                    onChange={(e) => setDiasHabiles(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {salarioMensual !== '' && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Salario Diario</p>
                    <p className="text-lg font-semibold text-slate-800">{formatCurrency(calc.salarioDiario)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Tarifa por Hora</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(calc.tarifaHora)}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Datos del Proyecto */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-emerald-600" size={20} />
                <h2 className="text-lg font-medium">Datos del Proyecto</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del Proyecto
                  </label>
                  <input
                    type="text"
                    value={nombreProyecto}
                    onChange={(e) => setNombreProyecto(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Ej. Diseño Estructural Casa Habitación"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Horas base a invertir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={horasProyecto}
                    onChange={(e) => setHorasProyecto(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full sm:w-1/2 px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Ej. 40"
                  />
                </div>

                <div className="sm:col-span-2 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Margen de imprevistos <span className="text-emerald-600 ml-1">+{margenImprevistos}%</span>
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        Horas extra por reuniones, correcciones y tiempos muertos
                      </p>
                    </div>
                    {horasProyecto !== '' && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cálculo efectivo</p>
                        <p className="text-sm font-semibold text-slate-600">
                          {horasProyecto} hrs base → {calc.horasEfectivas.toFixed(1)} hrs efectivas
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={margenImprevistos}
                    onChange={(e) => setMargenImprevistos(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                
                {/* Insumos Dinámicos */}
                <div className="col-span-1 sm:col-span-2 mt-2 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Insumos y Gastos Extra (sin IVA)
                    </label>
                    <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                      Total: {formatCurrency(calc.costoInsumosTotal)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {insumos.map((insumo) => (
                      <div key={insumo.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Descripción (ej. Licencia, Viáticos)"
                          value={insumo.descripcion}
                          onChange={(e) => updateInsumo(insumo.id, 'descripcion', e.target.value)}
                          className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                        />
                        <div className="relative w-32 sm:w-40 shrink-0">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={insumo.costo}
                            onChange={(e) => updateInsumo(insumo.id, 'costo', e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                          />
                        </div>
                        <button
                          onClick={() => removeInsumo(insumo.id)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                          title="Eliminar insumo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={addInsumo}
                    className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                  >
                    <Plus size={16} /> Agregar insumo
                  </button>
                </div>
              </div>
            </section>

            {/* Factor de Sobrecosto */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <Percent className="text-amber-600" size={20} />
                <h2 className="text-lg font-medium">Factor de Sobrecosto (FSC)</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Indirectos (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={indirectos}
                    onChange={(e) => setIndirectos(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Financiamiento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={financiamiento}
                    onChange={(e) => setFinanciamiento(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Utilidad (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={utilidad}
                    onChange={(e) => setUtilidad(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </section>

          </div>

          {/* Results Section */}
          <div className="lg:col-span-5 space-y-6" ref={resultsRef}>
            
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl sticky top-24">
              <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Total a Cobrar</h2>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">
                {formatCurrency(calc.totalCobrar)}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Precio Neto (sin IVA)</span>
                  <span className="font-medium text-slate-200">{formatCurrency(calc.precioNeto)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">IVA ({calc.ivaPct}%)</span>
                  <span className="font-medium text-slate-200">{formatCurrency(calc.iva)}</span>
                </div>
              </div>

              {leadCapturado ? (
                <div className="border-t border-slate-800 pt-6 animate-in fade-in duration-700">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Desglose del Precio Neto</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span className="text-slate-400">Mano de Obra</span>
                      </div>
                      <span className="font-medium">{formatCurrency(calc.costoManoObra)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-400">Insumos</span>
                      </div>
                      <span className="font-medium">{formatCurrency(calc.costoInsumosTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-slate-400">Indirectos</span>
                      </div>
                      <span className="font-medium">{formatCurrency(calc.montoIndirectos)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                        <span className="text-slate-400">Financiamiento</span>
                      </div>
                      <span className="font-medium">{formatCurrency(calc.montoFinanciamiento)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                        <span className="text-slate-400">Utilidad</span>
                      </div>
                      <span className="font-medium">{formatCurrency(calc.montoUtilidad)}</span>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div className="mt-8 h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#f8fafc' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-slate-800 pt-8 pb-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-blue-400 mb-4">
                    <Lock size={20} />
                  </div>
                  <p className="text-slate-300 text-sm font-medium mb-2">Desglose Detallado Bloqueado</p>
                  <p className="text-slate-500 text-xs px-4 leading-relaxed">
                    Para ver el desglose detallado y descargar tu reporte profesional, ingresa tus datos.
                  </p>
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={handleDownloadClick}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                >
                  <Download size={20} />
                  Descargar Reporte PDF
                </button>
              </div>
            </div>

            {/* CTA Section moved here */}
            <div className="mt-8">
              <a 
                href="https://romeleliseo.gumroad.com/l/cotizador-pro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block w-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500/50 text-white rounded-2xl p-6 transition-all duration-300 shadow-lg"
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      Cotizador Constructor PRO
                      <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      ¿Necesitas algo más complejo? Para proyectos de construcción con catálogo de conceptos y precios unitarios.
                    </p>
                  </div>
                  <div className="text-blue-400 text-sm font-semibold">
                    El siguiente paso lógico →
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total a Cobrar</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(calc.totalCobrar)}</p>
          </div>
          <button 
            onClick={scrollToResults}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-transform"
          >
            Ver Detalle
            <ChevronUp size={16} />
          </button>
        </div>
      </div>

      {/* Email Capture Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmailModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Descargar Resumen</h3>
                  <button 
                    onClick={() => setShowEmailModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                
                <p className="text-slate-600 mb-6 text-sm">
                  Ingresa tus datos para descargar tu reporte profesional detallado.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                      Nombre
                    </label>
                    <input 
                      type="text"
                      required
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                      Email
                    </label>
                    <input 
                      type="email"
                      required
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      placeholder="tu@email.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      if (userData.name && userData.email) {
                        proceedWithDownload(true);
                      } else {
                        alert('Por favor, ingresa tu nombre y email.');
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                  >
                    Descargar Ahora
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
