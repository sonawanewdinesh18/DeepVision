import { useAuth } from '../context/AuthContext';

export default function UserDashboard() {
    const { user, signOut } = useAuth();

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <h1>User Dashboard</h1>
            <p>Welcome, {user?.email}</p>
            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={signOut}
                    style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Sign Out
                </button>
            </div>
        </div>
    );
}
