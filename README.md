# RPi Pricing Tool

## Goal
The **RPi Pricing Tool** is a dashboard designed to help users analyze historical pricing trends and project future costs for various Raspberry Pi models. It provides a granular look at how component price fluctuations (specifically RAM and EMMC) impact the overall Bills of Materials (BOM) and final market pricing.

## Application Flow
The tool uses a structured, five-stage analysis pipeline built on `fullpage.js`:

1.  **Overview**: A high-level introduction to the tool's purpose and design philosophy.
2.  **RPi Selection & Market Pricing**: Users select specific Raspberry Pi models to analyze. This section displays historical market price trends for the chosen modules.
3.  **Component Pricing**: DRAM and EMMC storage prices that drive module costs.
4.  **Inflation Breakdown**: A Year-over-Year (YoY) analysis tool where users can select a historical period to see the de-compounded monthly inflation rates for each component.
5.  **Price Projections**: A transformation of historical trends into future forecasts. Users can adjust "Deltas" for specific components to see how different market scenarios will impact module pricing over the next 12 months.

## Disclaimers & Data Accuracy
Please read the following carefully before using the tool for decision-making:

*   **RPi Prices**: The Raspberry Pi pricing data shown in this tool represents **Manufacturer's Recommended Prices**. Actual retail prices may vary significantly based on region, vendor, and availability.
*   **Component Data (DRAM & EMMC)**: **CRITICAL: The current dataset for RAM and EMMC components contains simulated / placeholder data.** These prices are currently intended for demonstration of the tool's logic and UI and do not reflect accurate market spot prices. 
*   **Liability**: This tool is provided "as-is" for educational and demonstration purposes. **Use at your own risk.** Do not use this tool as the primary basis for financial or procurement decisions.

