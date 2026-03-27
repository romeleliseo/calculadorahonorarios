import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Info, Calculator, ArrowRight, DollarSign, Clock, Briefcase, Percent, Globe, Plus, Trash2, Download, FileText, Save } from 'lucide-react';
import { toPng } from 'html-to-image';

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
  const [insumos, setInsumos] = useState<{id: string, descripcion: string, costo: number | ''}[]>([
    { id: '1', descripcion: '', costo: '' }
  ]);

  // Factor de Sobrecosto
  const [indirectos, setIndirectos] = useState<number | ''>(15);
  const [financiamiento, setFinanciamiento] = useState<number | ''>(1);
  const [utilidad, setUtilidad] = useState<number | ''>(10);

  const captureRef = useRef<HTMLDivElement>(null);

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
    const ci = insumos.reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0);
    const ind = Number(indirectos) || 0;
    const fin = Number(financiamiento) || 0;
    const uti = Number(utilidad) || 0;
    const ivaPct = Number(ivaPorcentaje) || 0;

    const salarioDiario = sm / dh;
    const tarifaHora = salarioDiario / 8;
    const costoManoObra = tarifaHora * hp;
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
  }, [salarioMensual, diasHabiles, horasProyecto, insumos, indirectos, financiamiento, utilidad, ivaPorcentaje]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(val);
  };

  const exportAsImage = async () => {
    if (captureRef.current === null) return;
    
    try {
      const dataUrl = await toPng(captureRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Cotizacion-${nombreProyecto || 'Proyecto'}-${new Date().toLocaleDateString()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al exportar imagen:', err);
    }
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
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 group relative w-fit">
                    Horas a invertir en el proyecto
                    <div className="relative flex items-center">
                      <Info size={16} className="text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-center">
                        Se sugiere agregar un 20% extra de holgura para imprevistos.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
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
          <div className="lg:col-span-5 space-y-6">
            
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

              <div className="border-t border-slate-800 pt-6">
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

              <div className="mt-6">
                <button
                  onClick={exportAsImage}
                  className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-lg"
                >
                  <Download size={18} />
                  Descargar Resumen (Imagen)
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12">
          <a 
            href="https://romeleliseo.gumroad.com/l/cotizador-pro" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl p-1 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="bg-white/10 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Cotizador Constructor PRO</h3>
                <p className="text-blue-100 text-sm sm:text-base">
                  Para proyectos de construcción con catálogo de conceptos y precios unitarios.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold group-hover:bg-blue-50 transition-colors shrink-0">
                Conoce más
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>
        </div>

      </main>

      {/* Hidden Capture Area for Image Export */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={captureRef}
          className="w-[600px] bg-white p-12 text-slate-900"
        >
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-8">
            <div className="bg-blue-600 p-3 rounded-2xl text-white">
              <Calculator size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cotización de Honorarios</h1>
              <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Proyecto</h2>
            <p className="text-2xl font-bold text-slate-800">{nombreProyecto || 'Sin nombre de proyecto'}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl">
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Horas Invertidas</h3>
              <p className="text-2xl font-bold text-slate-800">{horasProyecto || 0} hrs</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Tarifa por Hora</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(calc.tarifaHora)}</p>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Desglose de Costos</h3>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-600">Mano de Obra</span>
              <span className="font-semibold">{formatCurrency(calc.costoManoObra)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-600">Insumos y Gastos</span>
              <span className="font-semibold">{formatCurrency(calc.costoInsumosTotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-600">Indirectos ({indirectos}%)</span>
              <span className="font-semibold">{formatCurrency(calc.montoIndirectos)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-600">Financiamiento ({financiamiento}%)</span>
              <span className="font-semibold">{formatCurrency(calc.montoFinanciamiento)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-600">Utilidad ({utilidad}%)</span>
              <span className="font-semibold">{formatCurrency(calc.montoUtilidad)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50 bg-slate-50/50 -mx-2 px-2 rounded-lg">
              <span className="text-slate-800 font-bold">Subtotal (Neto)</span>
              <span className="font-bold text-slate-800">{formatCurrency(calc.precioNeto)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-600">IVA ({calc.ivaPct}%)</span>
              <span className="font-semibold">{formatCurrency(calc.iva)}</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-3xl flex justify-between items-center">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Total a Cobrar</h3>
              <p className="text-3xl font-bold">{formatCurrency(calc.totalCobrar)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Generado con</p>
              <p className="text-sm font-bold">Calculadora Freelance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
