// src/views/DashboardView.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from '../components/layout/TopBar';
import { StatusBar } from '../components/layout/StatusBar';
import { HeroCard } from '../components/dashboard/HeroCard';
import { SHAPWaterfall } from '../components/dashboard/SHAPWaterfall';
import { ClusterMap } from '../components/dashboard/ClusterMap';
import { SimulatorPanel } from '../components/dashboard/SimulatorPanel';
import { BatchTable } from '../components/dashboard/BatchTable';
import { ModelMetrics } from '../components/dashboard/ModelMetrics';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { pageTransition, staggerContainer, fadeUp } from '../design/animations';

export function DashboardView() {
  const navigate       = useNavigate();
  const batchResults   = useAnalysisStore((s) => s.batchResults);
  const activeSampleId = useAnalysisStore((s) => s.activeSampleId);

  // Redirect to upload if no data
  useEffect(() => {
    if (batchResults.length === 0) navigate('/');
  }, [batchResults, navigate]);

  const activeSample = batchResults.find((r) => r.id === activeSampleId) ?? batchResults[0];
  if (!activeSample) return null;

  return (
    <motion.div {...pageTransition} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar
        title="Quality Analysis Dashboard"
        subtitle={`Batch · ${batchResults.length} samples analyzed`}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}
      >
        {/* Row 1: Hero Stats */}
        <motion.div variants={fadeUp}>
          <HeroCard />
        </motion.div>

        {/* Row 2: SHAP (55%) + Cluster Map (45%) */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
          <div className="glass card-hover" style={{ padding: 20 }}>
            <SHAPWaterfall
              shapValues={activeSample.shap_values}
              featureNames={activeSample.feature_names}
              title={`SHAP Analysis · ${activeSample.id}`}
            />
          </div>
          <div className="glass card-hover" style={{ padding: 20 }}>
            <ClusterMap />
          </div>
        </motion.div>

        {/* Row 3: Model Performance Metrics — full width */}
        <motion.div variants={fadeUp}>
          <div className="glass card-hover" style={{ padding: 20 }}>
            <ModelMetrics />
          </div>
        </motion.div>

        {/* Row 4: Simulator (40%) + Table (60%) */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '0.65fr 1fr', gap: 14 }}>
          <div className="glass card-hover" style={{ padding: 20 }}>
            <SimulatorPanel />
          </div>
          <div className="glass card-hover" style={{ padding: 20 }}>
            <BatchTable />
          </div>
        </motion.div>
      </motion.div>

      {/* Status Bar */}
      <StatusBar />
    </motion.div>
  );
}
