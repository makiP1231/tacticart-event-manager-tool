import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/common/Header';
import AdminLogin from './components/login/AdminLogin';
import ArtistLogin from './components/login/ArtistLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ArtistRegister from './components/admin/ArtistRegister';
import ArtistRegistrationComplete from './components/admin/ArtistRegistrationComplete';
import ArtistSetup from './components/login/ArtistSetup';
import ArtistDashboard from './components/artist/ArtistDashboard';
import ArtistProfileEdit from './components/artist/ArtistProfileEdit';
// import RequireAuth from './components/auth/RequireAuth'; // 後で使用するためコメントアウト
import AdminAccountSetup from './components/admin/AdminAccountSetup';
import EventRegistration from './components/admin/EventRegistration';
import EventRegistrationComplete from './components/admin/EventRegistrationComplete';
import EventList from './components/admin/EventList';
import ArtistList from './components/admin/ArtistList';
import ArtistDetail from './components/admin/ArtistDetail';
import EventDetails from './components/admin/EventDetails';
import EventCastingRegistration from './components/admin/EventCastingRegistration';
import EventEdit from './components/admin/EventEdit';
import HoldCasting from './components/admin/ArtistHoldCasting';
import ArtistGroups from './components/admin/ArtistGroups';
import PartsEdit from './components/admin/PartEdit';
import GenreManagement from './components/admin/EventGenreManagement';
import AdminProfileEdit from './components/admin/AdminProfileEdit';
import AdminMessage from './components/admin/Messages';
import ArtistMessage from './components/artist/Messages';
import EventOptionEdit from './components/admin/EventOptionEdit';

import TestConnection from './components/TestConnection';

import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <div className="container">
        <Routes>
          <Route path="/test-connection" element={<TestConnection />} />  
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/admin-setup" element={<AdminAccountSetup />} />
          <Route path="/admin-dashboard/artists/register" element={<ArtistRegister />} />
          <Route path="/admin-dashboard/artists/registration-complete" element={<ArtistRegistrationComplete />} />
          <Route path="/admin-dashboard/artists/list" element={<ArtistList />} />
          <Route path="/admin-dashboard/artists/:artistId" element={<ArtistDetail />} />
          <Route path="/admin-dashboard/artists/group" element={<ArtistGroups />} />
          <Route path="/admin-dashboard/events/register" element={<EventRegistration />} />
          <Route path="/admin-dashboard/events/complete" element={<EventRegistrationComplete />} />
          <Route path="/admin-dashboard/events" element={<EventList />} />
          <Route path="/admin-dashboard/events/event-details/:eventId" element={<EventDetails />} />
          <Route path="/admin-dashboard/events/event-casting-registration/:eventId" element={<EventCastingRegistration />} />
          <Route path="/admin-dashboard/events/edit/:eventId" element={<EventEdit />} />
          <Route path="/admin-dashboard/messages" element={<AdminMessage />} />
          <Route path="/admin-dashboard/genres/edit" element={<GenreManagement />} />
          <Route path="/admin-dashboard/casting/hold" element={<HoldCasting />} />
          <Route path="/admin-dashboard/parts-edit" element={<PartsEdit />} />
          <Route path="/admin-dashboard/profile-edit" element={<AdminProfileEdit />} />
          <Route path="/admin-dashboard/event-options/edit" element={<EventOptionEdit />} />
          <Route path="/artist-login" element={<ArtistLogin />} />
          <Route path="/artist-setup/:artistId" element={<ArtistSetup />} />
          <Route path="/artist-dashboard" element={<ArtistDashboard />} />
          <Route path="/artist-dashboard/messages" element={<ArtistMessage />} />
          <Route path="/artist-dashboard/profile" element={<ArtistProfileEdit />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
