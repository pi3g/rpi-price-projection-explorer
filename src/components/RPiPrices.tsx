import { useState, useMemo, useEffect, useCallback } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    type ChartOptions,
    type ChartData
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import ModuleFilter from './module_filter'

// Register ChartJS components including TimeScale
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
)

interface PricesProps {
    setSelectedModules: (items: any[]) => void;
    family: 'Single Board Computer' | 'Compute Module';
    setFamily: (val: 'Single Board Computer' | 'Compute Module') => void;
    selectedRam: number;
    setSelectedRam: (val: number) => void;
    selectedEmmc: number | null;
    setSelectedEmmc: (val: number | null) => void;
}

function Prices({
    setSelectedModules,
    family,
    setFamily,
    selectedRam,
    setSelectedRam,
    selectedEmmc,
    setSelectedEmmc
}: PricesProps) {
    const [hoveredDescription, setHoveredDescription] = useState<string | null>(null);
    const [selectedModules, setSelectedModulesLocal] = useState<any[]>([]);
    const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());

    const handleFilterChange = useCallback((modules: any[]) => {
        setSelectedModulesLocal(modules);
        setHiddenLabels(new Set()); // Reset legend visibility when filters change
    }, []);

    const currentlyVisibleModules = useMemo(() => {
        return selectedModules.filter((item: any) => {
            const label = `${item.NAME} (${item.RAM}GB / ${item.EMMC}GB)`
            return !hiddenLabels.has(label)
        })
    }, [selectedModules, hiddenLabels]);

    // Update parent whenever visible selection changes
    useEffect(() => {
        setSelectedModules(currentlyVisibleModules)
    }, [currentlyVisibleModules, setSelectedModules])

    const chartData: ChartData<'line'> = useMemo(() => {
        const colors = [
            '#646cff', '#ff64b0', '#42b883', '#ffcd56', '#ff9f40',
            '#9966ff', '#c9cbcf', '#36a2eb', '#ff6384', '#4bc0c0'
        ]

        return {
            datasets: selectedModules.map((item: any, index: number) => {
                const label = `${item.NAME} (${item.RAM}GB / ${item.EMMC}GB)`
                return {
                    label: label,
                    data: item.USD.map((price: number | null, i: number) => ({
                        x: item.DATE[i],
                        y: price
                    })) as any,
                    borderColor: colors[index % colors.length],
                    backgroundColor: colors[index % colors.length],
                    tension: 0,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    description: `${item.NAME} · ${item.DRAM_TYPE} · SKU: ${item.SKU} EAN:${item.EAN}`,
                    hidden: hiddenLabels.has(label)
                }
            })
        }
    }, [selectedModules, hiddenLabels])

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#ffffff',
                    usePointStyle: true,
                    pointStyle: 'rect',
                    padding: 20,
                    font: {
                        size: 14,
                        family: "'Inter', sans-serif"
                    }
                },
                onClick: (_, legendItem) => {
                    const label = legendItem.text;
                    setHiddenLabels(prev => {
                        const next = new Set(prev);
                        if (next.has(label)) {
                            next.delete(label);
                        } else {
                            next.add(label);
                        }
                        return next;
                    });
                },
                onHover: (_, legendItem) => {
                    const index = legendItem.datasetIndex;
                    if (typeof index === 'number') {
                        const desc = (chartData.datasets[index] as any).description;
                        setHoveredDescription(desc);
                    }
                },
                onLeave: () => {
                    setHoveredDescription(null);
                }
            },
            title: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleFont: { size: 14 },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                callbacks: {
                    title: (tooltipItems: any) => {
                        if (!tooltipItems.length) return '';
                        const date = new Date(tooltipItems[0].parsed.x);
                        return date.toLocaleDateString('en-DE', { month: 'long', year: 'numeric' });
                    },
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'month',
                    displayFormats: {
                        month: 'MMM yyyy'
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#888',
                    padding: 10,
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                afterDataLimits: (axis) => {
                    axis.min = axis.min - 5;
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#888',
                    callback: (value) => `$${value}`,
                    padding: 10
                },
                title: {
                    display: true,
                    text: 'Price (USD)',
                    color: '#ffffff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            }
        }
    }

    return (
        <div className="prices-inner-container">
            <div className="header-container">
                <h1 className="main-title mb-3">RPi Prices</h1>
                <ModuleFilter
                    onSelectionChange={handleFilterChange}
                    family={family}
                    setFamily={setFamily}
                    selectedRam={selectedRam}
                    setSelectedRam={setSelectedRam}
                    selectedEmmc={selectedEmmc}
                    setSelectedEmmc={setSelectedEmmc}
                />
            </div>

            <div className="chart-wrapper">
                <Line data={chartData} options={options} />
            </div>

            <div className={`description-box ${hoveredDescription ? 'visible' : ''}`}>
                {hoveredDescription}
            </div>

            <hr className="divider" />

            <div className="footer-row">
                <p className="footer-hint">
                    Enable / disable lines by clicking on the legend. · Recommended retail price data (USD) used for RPi modules. · Hover over the lines to see the exact price and date.
                </p>
            </div>
        </div>
    )
}

export default Prices
