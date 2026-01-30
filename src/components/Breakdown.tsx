import React, { useMemo, useState, useEffect } from 'react';
import { Dropdown, DropdownButton, Table, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import chip_dataset from '../assets/dataset_chips.json';
import rpi_dataset from '../assets/dataset_rpi.json';
import StackedBarChart from './StackedBarChart';

interface BreakdownProps {
    selected_modules: any[];
    ram_inf: number;
    emmc_inf: number;
    setRamInf: (val: number) => void;
    setEmmcInf: (val: number) => void;
    setBreakdownResult: (val: any[]) => void;
}

const Breakdown: React.FC<BreakdownProps> = ({ selected_modules, setRamInf, setEmmcInf, setBreakdownResult }) => {
    // Get available dates and sort chronologically for range logic
    const availableDates = useMemo(() => {
        if (!rpi_dataset[0] || !rpi_dataset[0].DATE) return [];
        return [...rpi_dataset[0].DATE].reverse();
    }, []);

    // Helper to find a date exactly 11 months later (e.g. Jan to Dec)
    const findOneYearLater = (startDate: string) => {
        const start = new Date(startDate);
        const target = new Date(start.getFullYear(), start.getMonth() + 11, 1);

        // Find the date in availableDates that matches the target month/year exactly
        return availableDates.find(d => {
            const date = new Date(d);
            return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
        });
    };

    // Initial valid fromDate should be one that has a YoY counterpart (Jan to Dec)
    const validFromOptions = useMemo(() => {
        return availableDates.filter(d => !!findOneYearLater(d));
    }, [availableDates]);

    const [fromDate, setFromDate] = useState<string>(validFromOptions[0] || '');
    const toDate = useMemo(() => findOneYearLater(fromDate) || '', [fromDate]);

    const monthsDiff = useMemo(() => {
        if (!fromDate || !toDate) return 0;
        const d1 = new Date(fromDate);
        const d2 = new Date(toDate);
        return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    }, [fromDate, toDate]);


    const fullDatasetDates = useMemo(() => rpi_dataset[0]?.DATE || [], []);
    const fromFullIdx = useMemo(() => fullDatasetDates.indexOf(fromDate), [fromDate, fullDatasetDates]);
    const toFullIdx = useMemo(() => fullDatasetDates.indexOf(toDate), [toDate, fullDatasetDates]);

    const handleFromChange = (newFrom: string) => {
        setFromDate(newFrom);
    };

    // Derived inflation values
    const stats = useMemo(() => {
        let totalRamAbs = 0;
        let totalEmmcAbs = 0;
        let ramCount = 0;
        let emmcCount = 0;

        if (fromFullIdx === -1 || toFullIdx === -1) return { ramAbs: 0, emmcAbs: 0, ramMonthly: 0, emmcMonthly: 0, emmcCount: 0 };

        selected_modules.forEach(module => {
            // RAM Lookup
            const ramData = chip_dataset.find(c =>
                String(c.NAME).trim().toUpperCase() === String(module.DRAM_TYPE).trim().toUpperCase() &&
                Number(c.SIZE) === Number(module.RAM)
            );
            if (ramData && Array.isArray(ramData.USD)) {
                const p1 = ramData.USD[fromFullIdx];
                const p2 = ramData.USD[toFullIdx];
                if (typeof p1 === 'number' && typeof p2 === 'number' && p1 > 0) {
                    totalRamAbs += ((p2 - p1) / p1) * 100;
                    ramCount++;
                }
            }

            // EMMC Lookup
            const targetEmmcSize = Number(module.EMMC);
            if (targetEmmcSize > 0) {
                const emmcData = chip_dataset.find(c =>
                    String(c.NAME).trim().toUpperCase() === 'EMMC' &&
                    Number(c.SIZE) === targetEmmcSize
                );
                if (emmcData && Array.isArray(emmcData.USD)) {
                    const p1 = emmcData.USD[fromFullIdx];
                    const p2 = emmcData.USD[toFullIdx];
                    if (typeof p1 === 'number' && typeof p2 === 'number' && p1 > 0) {
                        totalEmmcAbs += ((p2 - p1) / p1) * 100;
                        emmcCount++;
                    }
                }
            }
        });

        const ramAbs = ramCount > 0 ? totalRamAbs / ramCount : 0;
        const emmcAbs = emmcCount > 0 ? totalEmmcAbs / emmcCount : 0;

        const ramMonthly = monthsDiff > 0 ? (Math.pow(1 + ramAbs / 100, 1 / monthsDiff) - 1) * 100 : 0;
        const emmcMonthly = monthsDiff > 0 ? (Math.pow(1 + emmcAbs / 100, 1 / monthsDiff) - 1) * 100 : 0;

        return { ramAbs, emmcAbs, ramMonthly, emmcMonthly, emmcCount };
    }, [selected_modules, fromFullIdx, toFullIdx, monthsDiff]);

    // Update parent state with MONTHLY values
    useEffect(() => {
        setRamInf(stats.ramMonthly);
        setEmmcInf(stats.emmcMonthly);
    }, [stats.ramMonthly, stats.emmcMonthly, setRamInf, setEmmcInf]);

    const tableData = useMemo(() => {
        if (fromFullIdx === -1 || toFullIdx === -1) return [];

        return selected_modules.map(module => {
            const totalEnd = module.USD ? module.USD[toFullIdx] : 0;
            const totalStart = module.USD ? module.USD[fromFullIdx] : 0;
            const totalInf = totalStart > 0 ? ((totalEnd - totalStart) / totalStart) * 100 : 0;
            const totalMonthly = (totalStart > 0 && monthsDiff > 0) ? (Math.pow(1 + totalInf / 100, 1 / monthsDiff) - 1) * 100 : 0;

            // RAM Lookup
            const ramData = chip_dataset.find(c =>
                String(c.NAME).trim().toUpperCase() === String(module.DRAM_TYPE).trim().toUpperCase() &&
                Number(c.SIZE) === Number(module.RAM)
            );
            const ramEnd = (ramData && ramData.USD) ? ramData.USD[toFullIdx] : 0;
            const ramStart = (ramData && ramData.USD) ? ramData.USD[fromFullIdx] : 0;
            const ramPercentStart = totalStart > 0 ? (ramStart / totalStart) * 100 : 0;
            const ramPercentEnd = totalEnd > 0 ? (ramEnd / totalEnd) * 100 : 0;
            const ramInfValue = ramStart > 0 ? ((ramEnd - ramStart) / ramStart) * 100 : 0;
            const ramMonthly = (ramStart > 0 && monthsDiff > 0) ? (Math.pow(1 + ramInfValue / 100, 1 / monthsDiff) - 1) * 100 : 0;

            // EMMC Lookup
            let emmcEnd = 0;
            let emmcStart = 0;
            const targetEmmcSize = Number(module.EMMC);
            if (targetEmmcSize > 0) {
                const emmcData = chip_dataset.find(c =>
                    String(c.NAME).trim().toUpperCase() === 'EMMC' &&
                    Number(c.SIZE) === targetEmmcSize
                );
                emmcEnd = (emmcData && emmcData.USD) ? emmcData.USD[toFullIdx] : 0;
                emmcStart = (emmcData && emmcData.USD) ? emmcData.USD[fromFullIdx] : 0;
            }
            const emmcPercentStart = totalStart > 0 ? (emmcStart / totalStart) * 100 : 0;
            const emmcPercentEnd = totalEnd > 0 ? (emmcEnd / totalEnd) * 100 : 0;
            const emmcInfValue = emmcStart > 0 ? ((emmcEnd - emmcStart) / emmcStart) * 100 : 0;
            const emmcMonthly = (emmcStart > 0 && monthsDiff > 0) ? (Math.pow(1 + emmcInfValue / 100, 1 / monthsDiff) - 1) * 100 : 0;

            const otherStart = totalStart - ramStart - emmcStart;
            const otherEnd = totalEnd - ramEnd - emmcEnd;
            const otherInfValue = otherStart > 0 ? ((otherEnd - otherStart) / otherStart) * 100 : 0;
            const otherMonthly = (otherStart > 0 && monthsDiff > 0) ? (Math.pow(1 + otherInfValue / 100, 1 / monthsDiff) - 1) * 100 : 0;

            return {
                name: module.NAME,
                totalStart: totalStart.toFixed(2),
                totalEnd: totalEnd.toFixed(2),
                totalInf: totalInf.toFixed(1),
                totalMonthly: totalMonthly.toFixed(1),
                ramType: module.DRAM_TYPE,
                ramStartCost: ramStart.toFixed(2),
                ramEndCost: ramEnd.toFixed(2),
                ramStart: ramStart,
                ramEnd: ramEnd,
                ramStartPercent: ramPercentStart.toFixed(1),
                ramEndPercent: ramPercentEnd.toFixed(1),
                emmcStartCost: emmcStart.toFixed(2),
                emmcEndCost: emmcEnd.toFixed(2),
                emmcStart: emmcStart,
                emmcEnd: emmcEnd,
                emmcStartPercent: emmcPercentStart.toFixed(1),
                emmcEndPercent: emmcPercentEnd.toFixed(1),
                ramInf: ramInfValue.toFixed(1),
                ramMonthly: ramMonthly.toFixed(1),
                emmcInf: emmcInfValue.toFixed(1),
                emmcMonthly: emmcMonthly.toFixed(1),
                hasEmmc: targetEmmcSize > 0,
                otherInf: otherInfValue.toFixed(1),
                otherMonthly: otherMonthly.toFixed(1),
                otherStart: otherStart,
                otherEnd: otherEnd,
                orig_obj: module
            };
        });
    }, [selected_modules, toFullIdx, fromFullIdx, monthsDiff]);

    useEffect(() => {
        setBreakdownResult(tableData);
    }, [tableData, setBreakdownResult]);

    return (
        <div className="breakdown-container">
            <div className="breakdown-header text-center">
                <h1 className="main-title">Inflation Breakdown</h1>
                <div className="d-flex justify-content-center align-items-center gap-2 mt-3 flex-wrap">

                    <span className="filter-label">ANALYZE YoY from</span>
                    <DropdownButton
                        id="dropdown-from"
                        title={fromDate ? new Date(fromDate).toLocaleDateString('en-DE', { month: 'long', year: 'numeric' }) : 'Select Date'}
                        variant="outline-primary"
                        onSelect={(val: any) => handleFromChange(val)}
                        className="custom-dropdown"
                    >
                        {validFromOptions.map(date => (
                            <Dropdown.Item key={date} eventKey={date}>
                                {new Date(date).toLocaleDateString('en-DE', { month: 'long', year: 'numeric' })}
                            </Dropdown.Item>
                        ))}
                    </DropdownButton>
                    {/* <span className="filter-label">to</span>
                    <span className="filter-label fw-bold" style={{ color: 'var(--primary-color)' }}>
                        {toDate ? new Date(toDate).toLocaleDateString('en-DE', { month: 'long', year: 'numeric' }) : '-'}
                    </span> */}
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip id="yoy-tooltip">
                                {`Year over year for months from ${availableDates.length > 0 ? new Date(availableDates[0]).toLocaleDateString('en-DE', { month: 'long', year: 'numeric' }) : ''} to ${availableDates.length > 0 ? new Date(availableDates[availableDates.length - 1]).toLocaleDateString('en-DE', { month: 'long', year: 'numeric' }) : ''}`}
                            </Tooltip>
                        }
                    >
                        <span style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'var(--primary-color)' }}>ⓘ</span>
                    </OverlayTrigger>
                </div>
            </div>

            <p className="subtitle mb-1">Inflation Breakdown by module and component for the selected period. Hover over headers and cells for more information.</p>
            <div className="subtitle d-flex justify-content-center gap-4 mb-3" style={{ fontSize: '0.85rem' }}>
                Share Legend:
                <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#1b4965', borderRadius: '2px' }}></div>
                    <span>RAM</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#62b6cb', borderRadius: '2px' }}></div>
                    <span>EMMC</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#a1e0f0ff', borderRadius: '2px' }}></div>
                    <span>Residual</span>
                </div>
            </div>
            <div className="table-responsive">
                <Table variant="dark" hover className="bom-table">
                    <thead>
                        <tr>
                            <th>
                                <OverlayTrigger placement="top" overlay={<Tooltip>The Raspberry Pi model name</Tooltip>}>
                                    <span>Module</span>
                                </OverlayTrigger>
                            </th>
                            <th>
                                <OverlayTrigger placement="top" overlay={<Tooltip>Total module inflation over the selected period</Tooltip>}>
                                    <span>Total</span>
                                </OverlayTrigger>
                            </th>
                            <th>
                                <OverlayTrigger placement="top" overlay={<Tooltip>RAM Inflation over selected period</Tooltip>}>
                                    <span>RAM </span>
                                </OverlayTrigger>
                            </th>
                            <th>
                                <OverlayTrigger placement="top" overlay={<Tooltip>EMMC Inflation over selected period</Tooltip>}>
                                    <span>EMMC </span>
                                </OverlayTrigger>
                            </th>
                            <th>
                                <OverlayTrigger placement="top" overlay={<Tooltip>Inflation of all other module components over the selected period</Tooltip>}>
                                    <span>Residual </span>
                                </OverlayTrigger>
                            </th>
                            <th>
                                <OverlayTrigger placement="top" overlay={<Tooltip>Component weight at the start date</Tooltip>}>
                                    <span>Start Share</span>
                                </OverlayTrigger>
                            </th>
                            <th>
                                <OverlayTrigger placement="top" overlay={<Tooltip>Component weight at the end date</Tooltip>}>
                                    <span>End Share</span>
                                </OverlayTrigger>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, idx) => (
                            <tr key={idx}>
                                <td>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>{row.ramType}</Tooltip>}>
                                        <span>{row.name}</span>
                                    </OverlayTrigger>
                                </td>
                                <td>
                                    <OverlayTrigger placement="top" overlay={
                                        <Tooltip>
                                            MSRP (start/end):
                                            <br />
                                            {`$${row.totalStart} / $${row.totalEnd}`}
                                            <br />
                                            {`Monthly Inf.: ${row.totalMonthly}%`}
                                        </Tooltip>
                                    }>
                                        <span className={parseFloat(row.totalInf) >= 0 ? 'text-pink' : 'text-emerald'}>
                                            {parseFloat(row.totalInf) >= 0 ? '+' : ''}{row.totalInf}%
                                        </span>
                                    </OverlayTrigger>
                                </td>
                                <td>
                                    <OverlayTrigger placement="top" overlay={
                                        <Tooltip>
                                            RAM (start/end):
                                            <br />
                                            {`$${row.ramStartCost} / $${row.ramEndCost}`}
                                            <br />
                                            {`Monthly Inf.: ${row.ramMonthly}%`}
                                        </Tooltip>
                                    }>
                                        <span className={parseFloat(row.ramInf) >= 0 ? 'text-pink' : 'text-emerald'}>
                                            {parseFloat(row.ramInf) >= 0 ? '+' : ''}{row.ramInf}%
                                        </span>
                                    </OverlayTrigger>
                                </td>
                                <td>
                                    <OverlayTrigger placement="top" overlay={
                                        <Tooltip>
                                            {row.hasEmmc ? (
                                                <>
                                                    EMMC (start/end):
                                                    <br />
                                                    {`$${row.emmcStartCost} / $${row.emmcEndCost}`}
                                                    <br />
                                                    {`Monthly Inf.: ${row.emmcMonthly}%`}
                                                </>
                                            ) : 'No EMMC'}
                                        </Tooltip>
                                    }>
                                        <span className={row.hasEmmc ? (parseFloat(row.emmcInf) >= 0 ? 'text-pink' : 'text-emerald') : ''}>
                                            {row.hasEmmc ? `${parseFloat(row.emmcInf) >= 0 ? '+' : ''}${row.emmcInf}%` : '-'}
                                        </span>
                                    </OverlayTrigger>
                                </td>
                                <td className={parseFloat(row.otherInf) >= 0 ? 'text-pink' : 'text-emerald'}>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={
                                            <Tooltip>
                                                Residual (start/end):
                                                <br />
                                                {`$${row.otherStart.toFixed(2)} / $${row.otherEnd.toFixed(2)}`}
                                                <br />
                                                {`Monthly Inf.: ${row.otherMonthly}%`}
                                            </Tooltip>
                                        }
                                    >
                                        <span>{parseFloat(row.otherInf) >= 0 ? '+' : ''}{row.otherInf}%</span>
                                    </OverlayTrigger>
                                </td>
                                <td style={{ width: '15vw', maxWidth: '15vw' }}>
                                    <StackedBarChart dataItems={[
                                        { label: 'RAM', value: row.ramStart, color: '#1b4965' },
                                        { label: 'EMMC', value: row.emmcStart, color: '#62b6cb' },
                                        { label: 'Residual', value: row.otherStart, color: '#a1e0f0ff' }
                                    ]} />
                                </td>
                                <td style={{ width: '15vw', maxWidth: '15vw' }}>
                                    <StackedBarChart dataItems={[
                                        { label: 'RAM', value: row.ramEnd, color: '#1b4965' },
                                        { label: 'EMMC', value: row.emmcEnd, color: '#62b6cb' },
                                        { label: 'Residual', value: row.otherEnd, color: '#a1e0f0ff' }
                                    ]} />
                                </td>
                            </tr>
                        ))}
                        {tableData.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-muted">
                                    No modules selected. Please choose modules on the first page.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <div className="d-flex justify-content-center gap-4 flex-wrap mt-4">
                <Card className="inflation-card">
                    <Card.Body>
                        <Card.Title className="inflation-title text-center">RAM Inf. Abs. (%)</Card.Title>
                        <div className={`inflation-value text-center ${stats.ramAbs >= 0 ? 'pos' : 'neg'}`}>
                            {stats.ramAbs >= 0 ? '+' : ''}{stats.ramAbs.toFixed(2)}%
                        </div>
                    </Card.Body>
                </Card>
                <Card className="inflation-card">
                    <Card.Body>
                        <Card.Title className="inflation-title text-center">EMMC Inf. Abs. (%)</Card.Title>
                        <div className={`inflation-value text-center ${stats.emmcAbs >= 0 ? 'pos' : 'neg'}`}>
                            {stats.emmcCount > 0 ? `${stats.emmcAbs >= 0 ? '+' : ''}${stats.emmcAbs.toFixed(2)}%` : 'N/A'}
                        </div>
                    </Card.Body>
                </Card>
                <Card className="inflation-card">
                    <Card.Body>
                        <Card.Title className="inflation-title text-center">RAM Inf. Mon. (%)</Card.Title>
                        <div className={`inflation-value text-center ${stats.ramMonthly >= 0 ? 'pos' : 'neg'}`}>
                            {stats.ramMonthly >= 0 ? '+' : ''}{stats.ramMonthly.toFixed(2)}%
                        </div>
                    </Card.Body>
                </Card>
                <Card className="inflation-card">
                    <Card.Body>
                        <Card.Title className="inflation-title text-center">EMMC Inf. Mon. (%)</Card.Title>
                        <div className={`inflation-value text-center ${stats.emmcMonthly >= 0 ? 'pos' : 'neg'}`}>
                            {stats.emmcCount > 0 ? `${stats.emmcMonthly >= 0 ? '+' : ''}${stats.emmcMonthly.toFixed(2)}%` : 'N/A'}
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default Breakdown;
