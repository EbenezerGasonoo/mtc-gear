import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QRScannerModal from './components/QRScannerModal';

// Views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import AssetDetailView from './views/AssetDetailView';
import RequestsView from './views/RequestsView';
import CheckoutsView from './views/CheckoutsView';
import ReturnsView from './views/ReturnsView';
import MaintenanceView from './views/MaintenanceView';
import IncidentsView from './views/IncidentsView';
import KitsView from './views/KitsView';
import ReportsView from './views/ReportsView';
import UsersView from './views/UsersView';
import CategoriesView from './views/CategoriesView';
import LocationsView from './views/LocationsView';
import AuditLogsView from './views/AuditLogsView';
import SettingsView from './views/SettingsView';
import ProfileView from './views/ProfileView';
import CalendarView from './views/CalendarView';

function MainApp() {
    const { user, loading, showToast } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedAssetId, setSelectedAssetId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);

    // Cross-view state pass-throughs
    const [preselectedRequestForCheckout, setPreselectedRequestForCheckout] = useState(null);
    const [preselectedCheckoutForReturn, setPreselectedCheckoutForReturn] = useState(null);
    const [preselectedAssetForRequest, setPreselectedAssetForRequest] = useState(null);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070A10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse font-mono font-black text-xl">
                        MTC
                    </div>
                    <div className="text-xs font-mono text-slate-400 tracking-widest uppercase animate-pulse">
                        Loading MTC Gear Vault...
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginView />;
    }

    const handleSelectAsset = (id) => {
        setSelectedAssetId(id);
        setCurrentView('asset-detail');
    };

    const handleCheckoutRequest = (req) => {
        setPreselectedRequestForCheckout(req);
        setCurrentView('checkouts');
    };

    const handleInitiateReturn = (co) => {
        setPreselectedCheckoutForReturn(co);
        setCurrentView('returns');
    };

    const handleOpenRequestWithAsset = (asset) => {
        setPreselectedAssetForRequest(asset);
        setCurrentView('requests');
    };

    const handleRequestKit = (kit) => {
        showToast(`Requesting kit: ${kit.name}. Opening request form...`, 'info');
        setCurrentView('requests');
    };

    const handleScanSuccess = async (assetIdentifier) => {
        // Can be either asset ID string (e.g. MTC-CAM-001) or integer database ID
        try {
            const res = await fetch(`/api/assets?search=${encodeURIComponent(assetIdentifier)}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('mtc_gear_token')}`,
                    Accept: 'application/json',
                },
            });
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                const found = data.data[0];
                showToast(`Scanned asset: ${found.name} (${found.asset_id})`, 'success');
                handleSelectAsset(found.id);
            } else {
                showToast(`No equipment found matching '${assetIdentifier}'.`, 'warning');
            }
        } catch (e) {
            showToast('Scan lookup error.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F17] flex">
            {/* Sidebar */}
            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                <Navbar
                    onOpenSidebar={() => setSidebarOpen(true)}
                    onOpenScanner={() => setScannerOpen(true)}
                    onNewRequest={() => {
                        setPreselectedAssetForRequest(null);
                        setCurrentView('requests');
                    }}
                    currentView={currentView}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {currentView === 'dashboard' && (
                        <DashboardView
                            onNavigate={setCurrentView}
                            onNewRequest={() => setCurrentView('requests')}
                        />
                    )}

                    {currentView === 'inventory' && (
                        <InventoryView onSelectAsset={handleSelectAsset} />
                    )}

                    {currentView === 'calendar' && (
                        <CalendarView onNavigateTo={setCurrentView} />
                    )}

                    {currentView === 'asset-detail' && (
                        <AssetDetailView
                            assetId={selectedAssetId}
                            onBack={() => setCurrentView('inventory')}
                            onOpenRequestWithAsset={handleOpenRequestWithAsset}
                        />
                    )}

                    {currentView === 'requests' && (
                        <RequestsView
                            onCheckoutRequest={handleCheckoutRequest}
                            initialAssetToRequest={preselectedAssetForRequest}
                        />
                    )}

                    {currentView === 'checkouts' && (
                        <CheckoutsView
                            onInitiateReturn={handleInitiateReturn}
                            preselectedRequest={preselectedRequestForCheckout}
                        />
                    )}

                    {currentView === 'returns' && (
                        <ReturnsView preselectedCheckout={preselectedCheckoutForReturn} />
                    )}

                    {currentView === 'maintenance' && <MaintenanceView />}
                    {currentView === 'incidents' && <IncidentsView />}
                    {currentView === 'kits' && <KitsView onRequestKit={handleRequestKit} />}
                    {currentView === 'reports' && <ReportsView />}
                    {currentView === 'users' && <UsersView />}
                    {currentView === 'categories' && <CategoriesView />}
                    {currentView === 'locations' && <LocationsView />}
                    {currentView === 'audit-logs' && <AuditLogsView />}
                    {currentView === 'settings' && <SettingsView />}
                    {currentView === 'profile' && <ProfileView />}
                </main>
            </div>

            {/* Global QR Scanner Modal */}
            <QRScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
}
