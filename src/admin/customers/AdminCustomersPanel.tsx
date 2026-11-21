import { useState, useMemo } from 'react';
import { Search, User, Phone, Mail, MapPin } from 'lucide-react';
import { CustomerProfile, OrderRecord } from '@/types';

interface AdminCustomersPanelProps {
  customers: CustomerProfile[];
  orders: OrderRecord[];
}

export function AdminCustomersPanel({ customers, orders }: AdminCustomersPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const orderCountByUid = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      map.set(o.customerUid, (map.get(o.customerUid) || 0) + 1);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q),
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14241C]">
            Customer Directory ({customers.length})
          </h2>
          <p className="text-xs text-[#4F6156]">
            Private UID-keyed customer records. Search by phone number, email, or name. Accounts are
            never auto-merged by unverified phone numbers.
          </p>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-[#4F6156] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search phone or email..."
            aria-label="Search customers by phone or email"
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFF6F9] border border-[#E0CAD1] rounded-xl text-sm min-h-[44px] focus:outline-none focus:border-[#164A31] focus:ring-2 focus:ring-[#164A31]/12 transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-10 text-center text-sm text-[#4F6156] shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
          No customer profiles match &ldquo;{searchTerm}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((customer) => {
            const count = orderCountByUid.get(customer.uid) || 0;
            return (
              <div
                key={customer.uid}
                className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-5 space-y-2.5 shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#F5E6EC] border border-[#E5D5DA] text-[#164A31] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#14241C] truncate">
                        {customer.name}
                      </h3>
                      <p className="font-mono text-[11px] text-[#4F6156] truncate">
                        UID: {customer.uid} ({customer.isAnonymous ? 'Guest' : 'Registered'})
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#164A31] tabular-nums shrink-0">
                    {count} {count === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#4F6156] pt-2 border-t border-[#F0E2E7]">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span className="font-mono text-[#14241C]">{customer.phone}</span>
                  </p>
                  {customer.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                      <span>{customer.email}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                    <span>
                      {customer.zone} — {customer.address}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
