// Read-only matrix showing what each role can do. Sourced from the
// permissions catalog so the matrix and the actual gates can never
// drift apart.
'use client'
import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp, Shield, ShieldCheck, Truck } from 'lucide-react'
import { PERMISSIONS_BY_ROLE, PERMISSION_GROUPS } from '@/lib/permissions'

const ROLES = [
  { key: 'admin' as const, label: 'Admin', icon: ShieldCheck, color: 'text-purple-300' },
  { key: 'staff' as const, label: 'Staff', icon: Shield, color: 'text-blue-300' },
  { key: 'driver' as const, label: 'Driver', icon: Truck, color: 'text-amber-300' },
]

export default function PermissionsMatrix() {
  const [open, setOpen] = useState(false)
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
        aria-expanded={open}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Role catalog</p>
          <p className="text-white font-bold text-sm">What each role can do</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-500" aria-hidden="true" /> : <ChevronDown size={16} className="text-gray-500" aria-hidden="true" />}
      </button>
      {open && (
        <div className="border-t border-gray-800 p-5 overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 pb-3 pr-2">Permission</th>
                {ROLES.map(r => (
                  <th key={r.key} className="text-center w-24 pb-3">
                    <r.icon size={14} className={`mx-auto mb-1 ${r.color}`} aria-hidden="true" />
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">{r.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(group => (
                <>
                  <tr key={group.title} className="border-t border-gray-800">
                    <td colSpan={4} className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{group.title}</td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.key} className="text-gray-300">
                      <td className="py-1.5 pr-3 align-top">
                        <p className="text-sm">{item.label}</p>
                        {item.hint && <p className="text-[10px] text-gray-500">{item.hint}</p>}
                      </td>
                      {ROLES.map(role => {
                        const ok = PERMISSIONS_BY_ROLE[role.key].has(item.key)
                        return (
                          <td key={role.key} className="text-center align-top py-1.5">
                            {ok
                              ? <Check size={14} className="mx-auto text-green-400" aria-hidden="true" />
                              : <X size={14} className="mx-auto text-gray-700" aria-hidden="true" />}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-500 mt-4">
            Drivers only see the delivery queue — they're hard-redirected away from every other dashboard page.
            Roles are enforced both at the API layer and in the UI; this matrix is the single source of truth and
            lives in <span className="font-mono text-gray-400">lib/permissions.ts</span>.
          </p>
        </div>
      )}
    </section>
  )
}
