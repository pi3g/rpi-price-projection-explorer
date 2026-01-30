import React, { useMemo } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface StackedBarProps {
    dataItems: { label: string; value: number; color: string }[];
}

const StackedBarChart: React.FC<StackedBarProps> = ({ dataItems }) => {
    const total = useMemo(() => dataItems.reduce((acc, item) => acc + item.value, 0), [dataItems]);

    return (
        <div style={{
            display: 'flex',
            width: '100%',
            height: '24px',
            borderRadius: '4px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            {dataItems.map((item, idx) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;

                if (percentage <= 0) return null;

                return (
                    <OverlayTrigger
                        key={idx}
                        placement="top"
                        overlay={
                            <Tooltip id={`share-tooltip-${item.label}-${idx}`}>
                                {`${item.label}: $${item.value.toFixed(2)} | ${percentage.toFixed(1)}%`}
                            </Tooltip>
                        }
                    >
                        <div
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: item.color,
                                height: '100%',
                                transition: 'all 0.2s ease',
                                cursor: 'default'
                            }}
                            className="share-segment"
                        />
                    </OverlayTrigger>
                );
            })}
        </div>
    );
};

export default StackedBarChart;
