import { useEffect, useState } from 'react';
import { getRecords, addRecord, updateRecord, deleteRecord, adminLogin, adminLogout, isAdmin } from '../../api/client';
import { Check, Database, LogIn, LogOut, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';

const ENTITIES = ['schedules', 'rooms', 'events', 'announcements', 'assignments'];

export default function AdminPage() {
    const [authenticated, setAuthenticated] = useState(isAdmin());
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [entity, setEntity] = useState('announcements');
    const [records, setRecords] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [draft, setDraft] = useState('{}');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isBusy, setIsBusy] = useState(false);

    const loadRecords = async (selectedEntity = entity) => {
        setIsBusy(true);
        try {
            const data = await getRecords(selectedEntity);
            setRecords(data);
            setSelectedId(null);
            setDraft('{}');
        } catch (loadError) {
            setError(loadError.response?.data?.error || 'Unable to load records.');
        } finally {
            setIsBusy(false);
        }
    };

    useEffect(() => {
        if (authenticated) loadRecords();
    }, [authenticated, entity]);

    const showMessage = (text) => {
        setMessage(text);
        setError('');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        try {
            await adminLogin(adminId, password);
            setAuthenticated(true);
            setPassword('');
        } catch (loginError) {
            setError(loginError.response?.data?.error || 'Admin login failed.');
        }
    };

    const selectRecord = (record) => {
        setSelectedId(record.id);
        setDraft(JSON.stringify(record, null, 2));
        setError('');
    };

    const startNew = () => {
        setSelectedId(null);
        setDraft('{}');
        setError('');
    };

    const saveRecord = async () => {
        let payload;
        try {
            payload = JSON.parse(draft);
        } catch {
            setError('Enter valid JSON before saving.');
            return;
        }
        setIsBusy(true);
        try {
            if (selectedId) {
                await updateRecord(entity, selectedId, payload);
                showMessage('Record updated successfully.');
            } else {
                await addRecord(entity, payload);
                showMessage('Record added successfully.');
            }
            await loadRecords();
        } catch (saveError) {
            setError(saveError.response?.data?.error || 'Save failed.');
        } finally {
            setIsBusy(false);
        }
    };

    const removeRecord = async () => {
        if (!selectedId || !window.confirm('Delete this record permanently?')) return;
        setIsBusy(true);
        try {
            await deleteRecord(entity, selectedId);
            showMessage('Record deleted.');
            await loadRecords();
        } catch (deleteError) {
            setError(deleteError.response?.data?.error || 'Delete failed.');
        } finally {
            setIsBusy(false);
        }
    };

    const logout = async () => {
        await adminLogout();
        setAuthenticated(false);
        setRecords([]);
    };

    if (!authenticated) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
                <form onSubmit={handleLogin} className="glass w-full rounded-3xl border border-white/50 p-8 shadow-xl">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-950">Admin workspace</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to manage CampusOS data. Regular users can view the campus workspace but cannot change it.</p>
                    <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="admin-id">Admin ID</label>
                    <input id="admin-id" type="email" value={adminId} onChange={(event) => setAdminId(event.target.value)} placeholder="admin@campusos.demo" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" required />
                    <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="admin-password">Admin password</label>
                    <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" required />
                    {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
                    <button type="submit" className="gradient-btn mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white">
                        <LogIn className="h-4 w-4" />
                        Sign in as admin
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600"><ShieldCheck className="h-4 w-4" /> Restricted workspace</div>
                    <h1 className="mt-2 text-3xl font-black text-slate-950">CampusOS administration</h1>
                    <p className="mt-2 text-sm text-slate-500">Manage the records that power schedules, facilities, events, notices, and coursework.</p>
                </div>
                <button type="button" onClick={logout} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"><LogOut className="h-4 w-4" /> Sign out</button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                <section className="glass rounded-2xl border border-white/50 p-5">
                    <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Database className="h-4 w-4 text-blue-600" /> Data collections</h2><span className="text-xs text-slate-400">{records.length} records</span></div>
                    <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
                        {ENTITIES.map((item) => <button type="button" key={item} onClick={() => setEntity(item)} className={`rounded-xl px-3 py-3 text-left text-sm font-semibold capitalize transition ${entity === item ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}>{item}</button>)}
                    </div>
                    <button type="button" onClick={startNew} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 px-3 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"><Plus className="h-4 w-4" /> Add new record</button>
                </section>

                <section className="glass rounded-2xl border border-white/50 p-5">
                    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold capitalize text-slate-900">{selectedId ? 'Edit record' : `New ${entity.slice(0, -1)} record`}</h2>{selectedId && <button type="button" onClick={removeRecord} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}</div>
                    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} spellCheck="false" className="mt-4 min-h-72 w-full rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-sky-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" aria-label={`${entity} record JSON`} />
                    <div className="mt-3 flex items-center justify-between gap-3"><div className="text-xs text-slate-500">Select a record below to edit it.</div><button type="button" onClick={saveRecord} disabled={isBusy} className="gradient-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Save changes</button></div>
                    {message && <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><Check className="h-4 w-4" /> {message}</p>}
                    {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
                </section>
            </div>

            <section className="glass rounded-2xl border border-white/50 p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">{entity} records</h2><button type="button" onClick={() => loadRecords()} className="text-xs font-bold text-blue-600 hover:underline">Refresh data</button></div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {records.map((record) => <button type="button" key={record.id} onClick={() => selectRecord(record)} className={`rounded-xl border p-3 text-left transition ${record.id === selectedId ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}><div className="truncate text-xs font-bold text-slate-900">{record.title || record.name || record.course || record.room_number || record.id}</div><div className="mt-1 truncate text-[11px] text-slate-400">{record.id}</div></button>)}
                </div>
            </section>
        </div>
    );
}
