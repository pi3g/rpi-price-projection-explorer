import React, { useMemo, useEffect } from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import rpi_dataset from '../assets/dataset_rpi.json';

interface ModuleFilterProps {
    family: 'Single Board Computer' | 'Compute Module';
    setFamily: (val: 'Single Board Computer' | 'Compute Module') => void;
    selectedRam: number;
    setSelectedRam: (val: number) => void;
    selectedEmmc: number | null;
    setSelectedEmmc: (val: number | null) => void;
    onSelectionChange: (modules: any[]) => void;
}

const ModuleFilter: React.FC<ModuleFilterProps> = ({
    family,
    setFamily,
    selectedRam,
    setSelectedRam,
    selectedEmmc,
    setSelectedEmmc,
    onSelectionChange
}) => {
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
        setSelectedRam(8)
        if (emmcOptions.length > 0) {
            setSelectedEmmc(emmcOptions[0])
        } else {
            setSelectedEmmc(null)
        }
    }, [family, emmcOptions, setSelectedRam, setSelectedEmmc])

    // Broadcast change to parent
    useEffect(() => {
        const currentModules = familyFilteredDataset.filter((d: any) =>
            d.RAM === selectedRam && d.EMMC === selectedEmmc
        );
        onSelectionChange(currentModules);
    }, [familyFilteredDataset, selectedRam, selectedEmmc, onSelectionChange]);

    return (
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
                    title={selectedRam ? `${selectedRam} GB` : 'Select RAM'}
                    variant="outline-primary"
                    onSelect={(val: any) => setSelectedRam(parseFloat(val))}
                    className="custom-dropdown"
                >
                    {ramOptions.map((ram) => (
                        <Dropdown.Item key={ram} eventKey={ram.toString()}>
                            {ram} GB
                        </Dropdown.Item>
                    ))}
                </DropdownButton>
            </div>

            <div className="filter-container">
                <span className="filter-label">EMMC</span>
                <DropdownButton
                    disabled={family === 'Single Board Computer'}
                    id="dropdown-emmc"
                    title={selectedEmmc === 0 ? 'None' : (selectedEmmc !== null ? `${selectedEmmc} GB` : 'Select EMMC')}
                    variant="outline-primary"
                    onSelect={(val: any) => setSelectedEmmc(parseInt(val))}
                    className="custom-dropdown"
                >
                    {emmcOptions.map((emmc) => (
                        <Dropdown.Item key={emmc} eventKey={emmc.toString()}>
                            {emmc === 0 ? 'None' : `${emmc} GB`}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>
            </div>
        </div>
    );
};

export default ModuleFilter;
