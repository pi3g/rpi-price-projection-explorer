import { useMemo } from 'react'
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
import chip_dataset from '../assets/dataset_chips.json'
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

interface ComponentPricesProps {
    selected_modules: any[];
    setSelectedModules: (modules: any[]) => void;
    family: 'Single Board Computer' | 'Compute Module';
    setFamily: (val: 'Single Board Computer' | 'Compute Module') => void;
    selectedRam: number;
    setSelectedRam: (val: number) => void;
    selectedEmmc: number | null;
    setSelectedEmmc: (val: number | null) => void;
}

function ComponentPrices({
    selected_modules,
    setSelectedModules,
    family,
    setFamily,
    selectedRam,
    setSelectedRam,
    selectedEmmc,
    setSelectedEmmc
}: ComponentPricesProps) {
    const chartData = useMemo(() => {
        // ... existing chartData logic ...
        const colors = [
            '#646cff', '#ff64b0', '#42b883', '#ffcd56', '#ff9f40',
            '#9966ff', '#c9cbcf', '#36a2eb', '#ff6384', '#4bc0c0'
        ]

        // Identify unique components from selected RPi modules
        const requiredChipsList: { type: string; size: number }[] = [];
        const seen = new Set<string>();

        selected_modules.forEach(item => {
            // DRAM
            if (item.DRAM_TYPE && item.RAM) {
                const dramKey = `${item.DRAM_TYPE}-${item.RAM}`;
                if (!seen.has(dramKey)) {
                    requiredChipsList.push({ type: item.DRAM_TYPE, size: item.RAM });
                    seen.add(dramKey);
                }
            }
            // EMMC
            if (item.EMMC && item.EMMC > 0) {
                const emmcKey = `EMMC-${item.EMMC}`;
                if (!seen.has(emmcKey)) {
                    requiredChipsList.push({ type: 'EMMC', size: item.EMMC });
                    seen.add(emmcKey);
                }
            }
        });
        console.log(requiredChipsList);

        const datasets = requiredChipsList.map((chip, index) => {
            console.log(chip);
            const chipData = chip_dataset.find(c =>
                String(c.NAME).trim().toUpperCase() === String(chip.type).trim().toUpperCase() &&
                Number(c.SIZE) === Number(chip.size)
            );

            if (!chipData) {
                console.warn(`No market data found for component: [${chip.type.trim()}] [${chip.size}]`);
                return null;
            }

            const label = chip.type.toUpperCase() === 'EMMC'
                ? `EMMC ${chip.size}GB`
                : `${chip.type} ${chip.size}GB`;

            return {
                label: label,
                data: chipData.USD.map((price: number, i: number) => ({
                    x: chipData.DATE[i],
                    y: price
                })) as any,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length],
                tension: 0,
                pointRadius: 4,
                pointHoverRadius: 6,
            };
        }).filter(d => d !== null) as any[];

        return { datasets } as ChartData<'line'>;
    }, [selected_modules])

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
                onClick: () => { }, // Disable legend clicking
                labels: {
                    color: '#ffffff',
                    usePointStyle: true,
                    pointStyle: 'rect',
                    padding: 20,
                    font: {
                        size: 14,
                        family: "'Inter', sans-serif"
                    }
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
                    text: 'Market Price (USD)',
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
                <h1 className="main-title mb-3">Component Prices</h1>
                <ModuleFilter
                    onSelectionChange={setSelectedModules}
                    family={family}
                    setFamily={setFamily}
                    selectedRam={selectedRam}
                    setSelectedRam={setSelectedRam}
                    selectedEmmc={selectedEmmc}
                    setSelectedEmmc={setSelectedEmmc}
                />
                <p className="mt-3">The market price of the components used in the selected modules.</p>
            </div>

            <div className="chart-wrapper">
                {selected_modules.length > 0 ? (
                    <Line
                        key={`component-chart-${selected_modules.length}-${JSON.stringify(selected_modules.map(s => s.NAME).sort())}`}
                        data={chartData}
                        options={options}
                        redraw={true}
                    />
                ) : (
                    <div className="no-selection-overlay">
                        <p>Select RPi modules on the first page to view component cost breakdown.</p>
                    </div>
                )}
            </div>

            <hr className="divider" />

            <div className="footer-row">
                <p className="footer-hint">
                    WARNING: THESE PRICES ARE TOTALLY FABRICATED FOR NOW. Market prices for DRAM and Flash storage components. · Prices shown are spot market references.
                </p>
            </div>
        </div>
    )
}

export default ComponentPrices
