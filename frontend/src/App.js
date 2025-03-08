// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import AdminLogin from './components/login/AdminLogin';
import ArtistLogin from './components/login/ArtistLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ArtistRegister from './components/admin/ArtistRegister';
import ArtistRegistrationComplete from './components/admin/ArtistRegistrationComplete';
import ArtistSetup from './components/login/ArtistSetup';
import ArtistDashboard from './components/artist/ArtistDashboard';
import ArtistProfileEdit from './components/artist/ArtistProfileEdit';
import AdminAccountManagement from './components/admin/AdminAccountManagement';
import EventRegistration from './components/admin/EventRegistration';
import EventRegistrationComplete from './components/admin/EventRegistrationComplete';
import EventList from './components/admin/EventList';
import ArtistList from './components/admin/ArtistList';
import ArtistDetail from './components/admin/ArtistDetail';
import EventDetails from './components/admin/EventDetails';
import EventCastingRegistration from './components/admin/EventCastingRegistration';
import EventEdit from './components/admin/EventEdit';
import HoldCasting from './components/admin/HoldCastingArtist';
import ArtistGroups from './components/admin/ArtistGroups';
import PartsEdit from './components/admin/PartEdit';
import GenreManagement from './components/admin/EventGenreManagement';
import AdminProfileEdit from './components/admin/AdminProfileEdit';
import AdminMessage from './components/admin/Messages';
import ArtistMessage from './components/artist/Messages';
import EventOptionEdit from './components/admin/EventOptionEdit';
import ArtistOffers from './components/artist/ArtistOffers';
import ArtistOfferDetail from './components/artist/ArtistOfferDetails';
import HoldCastingHistory from './components/admin/HoldCastingHistory';
import ContractForm from './components/admin/ContractForm';
import HoldCastingDetail from './components/admin/HoldCastingDetail';
import ContractConfirm from './components/admin/ContractConfirm';
import ContractSuccess from './components/admin/ContractSuccess';
import ContractHistory from './components/admin/ContractHistory';
import ContractDetail from './components/admin/ContractDetail'; 
import VenueList from './components/admin/VenueList';
import VenueRegistration from './components/admin/VenueRegistration';
import VenueDetail from './components/admin/VenueDetail';
import ArtistContracts from './components/artist/ArtistContracts';
import ArtistEventDetails from './components/artist/ArtistEventDetails';
import ArtistContractDetail from './components/artist/ArtistContractDetail';
import ArtistVenueDetail from './components/artist/ArtistVenueDetail';

import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <div className="container">
        <Routes>
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/account-management" element={<AdminAccountManagement />} />
          <Route path="/admin-dashboard/artists/register" element={<ArtistRegister />} />
          <Route path="/admin-dashboard/artists/registration-complete" element={<ArtistRegistrationComplete />} />
          <Route path="/admin-dashboard/artists/list" element={<ArtistList />} />
          <Route path="/admin-dashboard/artists/:artistId" element={<ArtistDetail />} />
          <Route path="/admin-dashboard/artists/group" element={<ArtistGroups />} />
          <Route path="/admin-dashboard/events/register" element={<EventRegistration />} />
          <Route path="/admin-dashboard/events/registration-complete" element={<EventRegistrationComplete />} />
          <Route path="/admin-dashboard/events" element={<EventList />} />
          <Route path="/admin-dashboard/events/event-details/:eventId" element={<EventDetails />} />
          <Route path="/admin-dashboard/events/event-casting-registration/:eventId" element={<EventCastingRegistration />} />
          <Route path="/admin-dashboard/events/edit/:eventId" element={<EventEdit />} />
          <Route path="/admin-dashboard/venues" element={<VenueList />} />
          <Route path="/admin-dashboard/venues/register" element={<VenueRegistration />} />
          <Route path="/admin-dashboard/venues/:venueId" element={<VenueDetail />} />
          <Route path="/admin-dashboard/messages" element={<AdminMessage />} />
          <Route path="/admin-dashboard/genres/edit" element={<GenreManagement />} />
          <Route path="/admin-dashboard/casting/hold" element={<HoldCasting />} />
          <Route path="/admin-dashboard/parts-edit" element={<PartsEdit />} />
          <Route path="/admin-dashboard/profile-edit" element={<AdminProfileEdit />} />
          <Route path="/admin-dashboard/event-options/edit" element={<EventOptionEdit />} />
          <Route path="/admin-dashboard/casting/history" element={<HoldCastingHistory />} />
          <Route path="/admin/hold-casting-detail/:holdCastingId" element={<HoldCastingDetail />} />
          <Route path="/admin-dashboard/contract/form/:holdCastingId?" element={<ContractForm />} />
          <Route path="/admin-dashboard/contract/confirm" element={<ContractConfirm />} />
          <Route path="/admin-dashboard/contract/success" element={<ContractSuccess />} />
          <Route path="/admin-dashboard/contract/history" element={<ContractHistory />} />
          <Route path="/admin-dashboard/contract/detail/:contractArtistId" element={<ContractDetail />} />
          <Route path="/artist-login" element={<ArtistLogin />} />
          <Route path="/artist-setup/:artistId" element={<ArtistSetup />} />
          <Route path="/artist-dashboard" element={<ArtistDashboard />} />
          <Route path="/artist-dashboard/messages" element={<ArtistMessage />} />
          <Route path="/artist-dashboard/profile" element={<ArtistProfileEdit />} />
          <Route path="/artist-dashboard/offers" element={<ArtistOffers />} />
          <Route path="/artist-dashboard/offer/:offerID" element={<ArtistOfferDetail />} />
          <Route path="/artist-dashboard/contracts" element={<ArtistContracts />} />
          <Route path="/artist-dashboard/contract/detail/:contractArtistId" element={<ArtistContractDetail />} />
          <Route path="/artist-dashboard/event/:eventId" element={<ArtistEventDetails />} />
          <Route path="/artist-dashboard/venue/:venueId" element={<ArtistVenueDetail/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
