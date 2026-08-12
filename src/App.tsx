import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "@/sections/layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import RequireAcademyAuth from "@/components/RequireAcademyAuth";
import RoleRoute from "@/components/RoleRoute";
import { LoadingSpinner } from "@/components/Loading";
import RouteAnalytics from "@/components/RouteAnalytics";
import TelemetryProvider from "@/components/TelemetryProvider";
import { Analytics } from "@vercel/analytics/react";
import { UserRole } from "@/types/user";
import { LANDING_PAGES } from "@/data/landingPages";

const Home = lazy(() => import("@/pages/index"));
const Analysis = lazy(() => import("@/pages/analysis"));
const Login = lazy(() => import("@/pages/login"));
const Openings = lazy(() => import("@/pages/openings"));
const Play = lazy(() => import("@/pages/play"));
const Puzzles = lazy(() => import("@/pages/puzzles"));
const Training = lazy(() => import("@/pages/training"));
const Extension = lazy(() => import("@/pages/extension"));
const ToolsIndex = lazy(() => import("@/pages/tools/index"));
const NextMoveTool = lazy(() => import("@/pages/tools/next-move"));
const EditorTool = lazy(() => import("@/pages/tools/editor"));
const EloCalculatorTool = lazy(() => import("@/pages/tools/elo-calculator"));
const Review = lazy(() => import("@/pages/review"));
const Register = lazy(() => import("@/pages/register"));
const TermsAndConditions = lazy(() => import("@/pages/terms-and-conditions"));
const Thanks = lazy(() => import("@/pages/thanks"));
const Moved = lazy(() => import("@/pages/moved"));
const BlogIndex = lazy(() => import("@/pages/blog/index"));
const BlogPost = lazy(() => import("@/pages/blog/post"));
const LandingPage = lazy(() => import("@/pages/landing"));
const CoachDashboard = lazy(() => import("@/pages/coach/index"));
const CoachStudents = lazy(() => import("@/pages/coach/students"));
const CoachAssignments = lazy(() => import("@/pages/coach/assignments"));
const CoachTemplates = lazy(() => import("@/pages/coach/templates"));
const CoachMessages = lazy(() => import("@/pages/coach/messages"));
const CoachPlans = lazy(() => import("@/pages/coach/plans"));
const CoachAnalytics = lazy(() => import("@/pages/coach/analytics"));
const CoachStudentDetail = lazy(() => import("@/pages/coach/student-detail"));
const StudentHome = lazy(() => import("@/pages/student/index"));
const OpsDashboard = lazy(() => import("@/pages/ops/index"));

function App() {
  return (
    <ErrorBoundary>
      <Analytics />
      <RouteAnalytics />
      <TelemetryProvider />
      <Layout>
        <Suspense
          fallback={
            <LoadingSpinner message="Loading VoltChess..." variant="skeleton" />
          }
        >
          <Routes>
            {/* Public analysis & SEO landing pages */}
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/openings" element={<Openings />} />
            <Route path="/play" element={<Play />} />
            <Route path="/puzzles" element={<Puzzles />} />
            <Route path="/training" element={<Training />} />
            <Route path="/extension" element={<Extension />} />
            <Route path="/tools" element={<ToolsIndex />} />
            <Route path="/tools/next-move" element={<NextMoveTool />} />
            <Route path="/tools/editor" element={<EditorTool />} />
            <Route
              path="/tools/elo-calculator"
              element={<EloCalculatorTool />}
            />
            <Route path="/review" element={<Review />} />
            <Route
              path="/reanalysis"
              element={<Navigate to="/free-chess-game-analysis" replace />}
            />
            {LANDING_PAGES.map((page) => (
              <Route
                key={page.slug}
                path={page.path}
                element={<LandingPage />}
              />
            ))}
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="/thanks" element={<Thanks />} />
            <Route path="/moved" element={<Moved />} />

            {/* Academy auth entry */}
            <Route path="/login" element={<Login />} />
            <Route path="/sign-in" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />

            {/* Academy-only (coach / student) */}
            <Route element={<RequireAcademyAuth />}>
              <Route
                path="/coach"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/coach/students"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachStudents />
                  </RoleRoute>
                }
              />
              <Route
                path="/coach/assignments"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachAssignments />
                  </RoleRoute>
                }
              />
              <Route
                path="/coach/templates"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachTemplates />
                  </RoleRoute>
                }
              />
              <Route
                path="/coach/messages"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachMessages />
                  </RoleRoute>
                }
              />
              <Route
                path="/coach/plans"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachPlans />
                  </RoleRoute>
                }
              />
              <Route
                path="/coach/analytics"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachAnalytics />
                  </RoleRoute>
                }
              />
              <Route
                path="/coach/students/:id"
                element={
                  <RoleRoute allowed={[UserRole.Coach, UserRole.Admin]}>
                    <CoachStudentDetail />
                  </RoleRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <RoleRoute allowed={[UserRole.Student]}>
                    <StudentHome />
                  </RoleRoute>
                }
              />
              <Route
                path="/ops"
                element={
                  <RoleRoute allowed={[UserRole.Admin]}>
                    <OpsDashboard />
                  </RoleRoute>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
