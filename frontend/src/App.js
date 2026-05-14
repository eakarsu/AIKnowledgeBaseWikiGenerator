import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import ArticleEditor from './pages/ArticleEditor';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import Tags from './pages/Tags';
import TagDetail from './pages/TagDetail';
import Templates from './pages/Templates';
import TemplateDetail from './pages/TemplateDetail';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Bookmarks from './pages/Bookmarks';
import Search from './pages/Search';
import Analytics from './pages/Analytics';
import AITools from './pages/AITools';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Users from './pages/Users';
import AIFeatures from './pages/AIFeatures';
import FeatureShowcase from './pages/FeatureShowcase';
import AIArticleSuggester from './pages/AIArticleSuggester';
import AIApiDocumentation from './pages/AIApiDocumentation';
import AISearchOptimizer from './pages/AISearchOptimizer';
import AIOutdatedContent from './pages/AIOutdatedContent';
import AITranslationEngine from './pages/AITranslationEngine';
import AIFaqGenerator from './pages/AIFaqGenerator';
import SmartSuggestions from './pages/SmartSuggestions';
import KnowledgeGraph from './pages/KnowledgeGraph';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="articles" element={<Articles />} />
          <Route path="articles/new" element={<ArticleEditor />} />
          <Route path="articles/:id" element={<ArticleDetail />} />
          <Route path="articles/:id/edit" element={<ArticleEditor />} />
          <Route path="categories" element={<Categories />} />
          <Route path="categories/:id" element={<CategoryDetail />} />
          <Route path="tags" element={<Tags />} />
          <Route path="tags/:id" element={<TagDetail />} />
          <Route path="templates" element={<Templates />} />
          <Route path="templates/:id" element={<TemplateDetail />} />
          <Route path="teams" element={<Teams />} />
          <Route path="teams/:id" element={<TeamDetail />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="search" element={<Search />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="features" element={<FeatureShowcase />} />
          <Route path="ai-tools" element={<AITools />} />
          <Route path="ai-features" element={<AIFeatures />} />
          <Route path="ai-features/article-suggester" element={<AIArticleSuggester />} />
          <Route path="ai-features/article-suggester/:id" element={<AIArticleSuggester />} />
          <Route path="ai-features/api-documentation" element={<AIApiDocumentation />} />
          <Route path="ai-features/api-documentation/:id" element={<AIApiDocumentation />} />
          <Route path="ai-features/search-optimizer" element={<AISearchOptimizer />} />
          <Route path="ai-features/search-optimizer/:id" element={<AISearchOptimizer />} />
          <Route path="ai-features/outdated-content" element={<AIOutdatedContent />} />
          <Route path="ai-features/outdated-content/:id" element={<AIOutdatedContent />} />
          <Route path="ai-features/translation-engine" element={<AITranslationEngine />} />
          <Route path="ai-features/translation-engine/:id" element={<AITranslationEngine />} />
          <Route path="ai-features/faq-generator" element={<AIFaqGenerator />} />
          <Route path="ai-features/faq-generator/:id" element={<AIFaqGenerator />} />
          <Route path="smart-suggestions" element={<SmartSuggestions />} />
          <Route path="knowledge-graph" element={<KnowledgeGraph />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
