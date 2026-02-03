import React, { useState, useMemo } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions,
    type ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface ProjectionsProps {
    ram_inf: number;
    emmc_inf: number;
    breakdown_result: any[];
}

const Projections: React.FC<ProjectionsProps> = ({ ram_inf, emmc_inf, breakdown_result }) => {
    // Project for 12 months (one year)
    const projectionMonths = 12;

    const [delta_ram_inflation, setDeltaRamInflation] = useState<number>(0.0);
    const [delta_emmc_inflation, setDeltaEmmcInflation] = useState<number>(0.0);
    const [delta_bom_inflation, setDeltaBomInflation] = useState<number>(0.0);

    // ram_inf and emmc_inf are passed as monthly values from Breakdown
    const working_ram_monthly = useMemo(() => ram_inf + delta_ram_inflation, [ram_inf, delta_ram_inflation]);
    const working_emmc_monthly = useMemo(() => emmc_inf + delta_emmc_inflation, [emmc_inf, delta_emmc_inflation]);

    const adjustDelta = (type: 'ram' | 'emmc' | 'bom', amount: number) => {
        if (type === 'ram') {
            setDeltaRamInflation(prev => parseFloat((prev + amount).toFixed(2)));
        } else if (type === 'emmc') {
            setDeltaEmmcInflation(prev => parseFloat((prev + amount).toFixed(2)));
        } else {
            setDeltaBomInflation(prev => parseFloat((prev + amount).toFixed(2)));
        }
    };

    const chartData = useMemo(() => {
        const colors = [
            '#646cff', '#ff64b0', '#42b883', '#ffcd56', '#ff9f40',
            '#9966ff', '#c9cbcf', '#36a2eb', '#ff6384', '#4bc0c0'
        ];

        // console.log('--- Projection Calculations (Monthly Scale) Start ---');

        const labels = ['Current'];
        for (let i = 1; i <= projectionMonths; i++) {
            labels.push(`M${i}`);
        }

        const datasets = breakdown_result.map((module, index) => {
            const history = module.orig_obj.USD;
            const startTotal = history[history.length - 1];

            // Get component shares from the "end" of the period (current state)
            const ramP = parseFloat(module.ramEndPercent) || 0;
            const emmcP = module.hasEmmc ? (parseFloat(module.emmcEndPercent) || 0) : 0;
            const otherP = Math.max(0, 100 - ramP - emmcP);
            const moduleOtherMonthly = (parseFloat(module.otherMonthly) || 0) + delta_bom_inflation;

            let currentRam = startTotal * (ramP / 100);
            let currentEmmc = startTotal * (emmcP / 100);
            let currentOther = startTotal * (otherP / 100);
            let currentTotal = startTotal;

            const dataPoints = [startTotal];

            // console.log(`${module.name} start: $${currentTotal.toFixed(2)} | RAM Inf(m): ${working_ram_monthly.toFixed(2)}% | EMMC Inf(m): ${working_emmc_monthly.toFixed(2)}% | BOM(Other) Inf(m): ${moduleOtherMonthly.toFixed(2)}%`);

            for (let m = 1; m <= projectionMonths; m++) {
                currentRam *= (1 + (working_ram_monthly || 0) / 100);
                currentEmmc *= (1 + (working_emmc_monthly || 0) / 100);
                currentOther *= (1 + (moduleOtherMonthly || 0) / 100);

                currentTotal = currentRam + currentEmmc + currentOther;
                dataPoints.push(currentTotal);

                // console.log(`${module.name} M${m}: $${currentTotal.toFixed(2)} | RAM: ${(currentTotal > 0 ? (currentRam / currentTotal * 100) : 0).toFixed(1)}% | EMMC: ${(currentTotal > 0 ? (currentEmmc / currentTotal * 100) : 0).toFixed(1)}% | Other: ${(currentTotal > 0 ? (currentOther / currentTotal * 100) : 0).toFixed(1)}%`);
            }

            return {
                label: module.name,
                data: dataPoints,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length],
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 4,
                pointHoverRadius: 6,
            };
        });

        // console.log('--- Projection Calculations End ---');

        return {
            labels,
            datasets
        } as ChartData<'line'>;
    }, [breakdown_result, working_ram_monthly, working_emmc_monthly, delta_bom_inflation]);

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#fff',
                    // usePointStyle: true,
                    // pointStyle: 'line',
                    usePointStyle: true,
                    pointStyle: 'rect',
                    padding: 20,
                    font: {
                        size: 14,
                        family: "'Inter', sans-serif"
                    }
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#888' }
            },
            y: {
                afterDataLimits: (axis) => {
                    axis.min = axis.min - 5;
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                    color: '#888',
                    callback: (value) => `$${value}`
                }
            }
        }
    };

    return (
        <div className="projections-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="header-container text-center">
                <h1 className="main-title">Price Projection</h1>
            </div>

            <div className="projection-controls d-flex flex-column align-items-center gap-2 mt-2">
                <div className="d-flex gap-3 justify-content-center flex-wrap" style={{ fontSize: '0.85rem', color: '#888' }}>
                    <span >Monthly Inflation (YoY Base):</span>
                    <span>RAM <span className="text-blue">{ram_inf.toFixed(2)}%</span></span>
                    <span>EMMC <span className="text-blue">{emmc_inf ? `${emmc_inf.toFixed(2)}%` : 'N/A'}</span></span>
                    {breakdown_result.map(m => (
                        <span key={m.name}>
                            {m.name} Other <span className="text-blue">{parseFloat(m.otherMonthly).toFixed(2)}%</span>
                        </span>
                    ))}
                </div>

                <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap mt-2">
                    <div className="control-group d-flex align-items-center gap-2">
                        <span className="filter-label">Manual Adjustments: RAM</span>
                        <InputGroup size="sm" style={{ width: '110px' }}>
                            <Button variant="outline-secondary" size="sm" onClick={() => adjustDelta('ram', -0.5)}>-</Button>
                            <Form.Control
                                type="number"
                                value={delta_ram_inflation}
                                onChange={(e) => setDeltaRamInflation(parseFloat(e.target.value) || 0)}
                                className="bg-dark text-white text-center no-spinners"
                                step="0.1"
                            />
                            <Button variant="outline-secondary" size="sm" onClick={() => adjustDelta('ram', 0.5)}>+</Button>
                        </InputGroup>
                    </div>

                    <div className="control-group d-flex align-items-center gap-2">
                        <span className="filter-label">EMMC</span>
                        <InputGroup size="sm" style={{ width: '110px' }}>
                            <Button variant="outline-secondary" size="sm" onClick={() => adjustDelta('emmc', -0.5)}>-</Button>
                            <Form.Control
                                type="number"
                                value={delta_emmc_inflation}
                                onChange={(e) => setDeltaEmmcInflation(parseFloat(e.target.value) || 0)}
                                className="bg-dark text-white text-center no-spinners"
                                step="0.1"
                            />
                            <Button variant="outline-secondary" size="sm" onClick={() => adjustDelta('emmc', 0.5)}>+</Button>
                        </InputGroup>
                    </div>

                    <div className="control-group d-flex align-items-center gap-2">
                        <span className="filter-label">Other</span>
                        <InputGroup size="sm" style={{ width: '110px' }}>
                            <Button variant="outline-secondary" size="sm" onClick={() => adjustDelta('bom', -0.5)}>-</Button>
                            <Form.Control
                                type="number"
                                value={delta_bom_inflation}
                                onChange={(e) => setDeltaBomInflation(parseFloat(e.target.value) || 0)}
                                className="bg-dark text-white text-center no-spinners"
                                step="0.1"
                            />
                            <Button variant="outline-secondary" size="sm" onClick={() => adjustDelta('bom', 0.5)}>+</Button>
                        </InputGroup>
                    </div>
                </div>
            </div>

            <div className="chart-wrapper mt-3" style={{ height: '400px', width: '100%', flex: 1 }}>
                <Line data={chartData} options={options} />
            </div>

            <div className="projection-footer mt-3 mb-2 text-center">
                <p className="footer-hint" style={{ fontSize: '0.8rem' }}>
                    To manually adjust the monthly inflation values used for projections, use the controls above.
                </p>
                <p className="footer-hint" style={{ fontSize: '0.8rem' }}>
                    Monthly inflation metrics are calculated based on the selected Year-over-Year (YoY) period. Projections apply these monthly trends over 12 consecutive months.
                </p>
            </div>
        </div>
    );
};

export default Projections;
