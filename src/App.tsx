import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "@/sections/layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/Loading";
import RouteAnalytics from "@/components/RouteAnalytics";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/index"));
const Analysis = lazy(() => import("@/pages/analysis"));
const Database = lazy(() => import("@/pages/database"));
const Login = lazy(() => import("@/pages/login"));
const Openings = lazy(() => import("@/pages/openings"));
const Play = lazy(() => import("@/pages/play"));
const Puzzles = lazy(() => import("@/pages/puzzles"));
const Reanalysis = lazy(() => import("@/pages/reanalysis"));
const Register = lazy(() => import("@/pages/register"));
const TermsAndConditions = lazy(() => import("@/pages/terms-and-conditions"));
const Thanks = lazy(() => import("@/pages/thanks"));

function App() {
  return (
    <ErrorBoundary>
      <RouteAnalytics />
      <Layout>
        <Suspense
          fallback={
            <LoadingSpinner message="Loading VoltChess..." variant="skeleton" />
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/database" element={<Database />} />
            <Route path="/login" element={<Login />} />
            <Route path="/openings" element={<Openings />} />
            <Route path="/play" element={<Play />} />
            <Route path="/puzzles" element={<Puzzles />} />
            <Route path="/reanalysis" element={<Reanalysis />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="/thanks" element={<Thanks />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
