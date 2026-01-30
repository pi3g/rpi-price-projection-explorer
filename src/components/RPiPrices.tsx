import { useState, useMemo, useEffect } from 'react'
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
import { Dropdown, DropdownButton } from 'react-bootstrap'
import rpi_dataset from '../assets/dataset_rpi.json'

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
}

function Prices({ setSelectedModules }: PricesProps) {
    const [hoveredDescription, setHoveredDescription] = useState<string | null>(null)
    const [family, setFamily] = useState<'Single Board Computer' | 'Compute Module'>('Compute Module')
    const [selectedRam, setSelectedRam] = useState<number>(8192)
    const [selectedEmmc, setSelectedEmmc] = useState<number | null>(null)
    const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set())

    const familyFilteredDataset = useMemo(() => {
        if (family === 'Single Board Computer') {
            return rpi_dataset.filter((d: any) => d.NAME.includes('Pi '))
        } else {
            return rpi_dataset.filter((d: any) => d.NAME.includes('CM'))
        }
    }, [family])

    const ramOptions = useMemo(() => {
        const rams = new Set<number>()
        familyFilteredDataset.forEach((item: any) => {
            if (item.RAM !== null) rams.add(item.RAM)
        })
        return Array.from(rams).sort((a, b) => a - b)
    }, [familyFilteredDataset])

    const emmcOptions = useMemo(() => {
        const emmcs = new Set<number>()
        familyFilteredDataset.forEach((item: any) => {
            if (item.EMMC !== null) emmcs.add(item.EMMC)
        })
        return Array.from(emmcs).sort((a, b) => a - b)
    }, [familyFilteredDataset])

    // Reset RAM and EMMC to defaults when family changes
    useEffect(() => {
        setSelectedRam(8192)
        if (emmcOptions.length > 0) {
            setSelectedEmmc(emmcOptions[0])
        }
        setHiddenLabels(new Set()) // Reset legend visibility
    }, [family, emmcOptions])

    const currentSelection = useMemo(() => {
        const finalFiltered = familyFilteredDataset.filter((d: any) => d.RAM === selectedRam && d.EMMC === selectedEmmc)
        return finalFiltered.filter((item: any) => {
            const label = `${item.NAME} (${item.RAM}MB / ${item.EMMC}GB)`
            return !hiddenLabels.has(label)
        })
    }, [familyFilteredDataset, selectedRam, selectedEmmc, hiddenLabels])

    // Update parent whenever selection changes
    useEffect(() => {
        setSelectedModules(currentSelection)
    }, [currentSelection, setSelectedModules])

    const chartData: ChartData<'line'> = useMemo(() => {
        const colors = [
            '#646cff', '#ff64b0', '#42b883', '#ffcd56', '#ff9f40',
            '#9966ff', '#c9cbcf', '#36a2eb', '#ff6384', '#4bc0c0'
        ]

        const filtered = familyFilteredDataset.filter((d: any) => d.RAM === selectedRam && d.EMMC === selectedEmmc)

        return {
            datasets: filtered.map((item: any, index: number) => {
                const label = `${item.NAME} (${item.RAM}MB / ${item.EMMC}GB)`
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
                    description: `${item.NAME} ${item.DRAM_TYPE}`,
                    hidden: hiddenLabels.has(label)
                }
            })
        }
    }, [familyFilteredDataset, selectedRam, selectedEmmc, hiddenLabels])

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
                <div className="filter-row-top">
                    <div className="filter-container">
                        <span className="filter-label">Family</span>
                        <DropdownButton
                            id="dropdown-family"
                            title={family}
                            variant="outline-primary"
                            onSelect={(val: any) => setFamily(val)}
                            className="custom-dropdown"
                        >
                            <Dropdown.Item eventKey="Single Board Computer">Single Board Computer</Dropdown.Item>
                            <Dropdown.Item eventKey="Compute Module">Compute Module</Dropdown.Item>
                        </DropdownButton>
                    </div>

                    <div className="filter-container">
                        <span className="filter-label">RAM</span>
                        <DropdownButton
                            id="dropdown-ram"
                            title={selectedRam ? `${selectedRam} MB` : 'Select RAM'}
                            variant="outline-primary"
                            onSelect={(val: any) => setSelectedRam(parseInt(val))}
                            className="custom-dropdown"
                        >
                            {ramOptions.map((ram) => (
                                <Dropdown.Item key={ram} eventKey={ram.toString()}>
                                    {ram} MB
                                </Dropdown.Item>
                            ))}
                        </DropdownButton>
                    </div>

                    <div className="filter-container">
                        <span className="filter-label">EMMC</span>
                        <DropdownButton
                            id="dropdown-emmc"
                            title={selectedEmmc !== null ? `${selectedEmmc} GB` : 'Select EMMC'}
                            variant="outline-primary"
                            onSelect={(val: any) => setSelectedEmmc(parseInt(val))}
                            className="custom-dropdown"
                        >
                            {emmcOptions.map((emmc) => (
                                <Dropdown.Item key={emmc} eventKey={emmc.toString()}>
                                    {emmc} GB
                                </Dropdown.Item>
                            ))}
                        </DropdownButton>
                    </div>
                </div>
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
