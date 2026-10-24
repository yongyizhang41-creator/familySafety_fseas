import useGroupStore from '../store/groupStore';
import SafeZoneForm from '../components/SafeZone/SafeZoneForm';
import SafeZoneList from '../components/SafeZone/SafeZoneList';

export default function SafeZones() {
  const { group } = useGroupStore();

  if (!group) {
    return <div className="pt-24 p-6 text-center text-gray-400">Join a group to manage safe zones.</div>;
  }

  return (
    <div className="min-h-screen bg-darkbg pt-20 p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Manage Safe Zones</h1>
          <p className="text-gray-400 mt-2">Draw invisible boundaries and receive immediate alerts when group members enter or exit them.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* List panel */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-xl">
             <h2 className="text-xl font-bold mb-4">Configured Zones</h2>
             <SafeZoneList />
          </div>

          {/* Form panel */}
          <div className="sticky top-24">
             <SafeZoneForm />
          </div>
        </div>
      </div>
    </div>
  );
}
