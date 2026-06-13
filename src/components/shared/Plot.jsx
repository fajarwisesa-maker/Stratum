// src/components/shared/Plot.jsx
// Factory-based Plotly component — handles CJS/ESM interop
import plotlyFactory from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

// Handle CJS default export interop
const createPlotlyComponent = plotlyFactory.default || plotlyFactory;
const Plot = createPlotlyComponent(Plotly);

export default Plot;
