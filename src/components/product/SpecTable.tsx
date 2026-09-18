import { type Phone } from "@/types";

export function SpecTable({ phone }: { phone: Phone }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 px-2">Detailed Specifications</h2>
      <div className="space-y-6">
        
        {phone.display && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">📱 Display</h3>
            </div>
            <div className="p-0">
              <SpecRow label="Type" value={phone.display.type} />
              <SpecRow label="Size" value={`${phone.display.size} inches`} />
              <SpecRow label="Resolution" value={phone.display.resolution} />
              <SpecRow label="Protection" value={phone.display.protection} />
            </div>
          </div>
        )}

        {phone.platform && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">⚙️ Platform & Performance</h3>
            </div>
            <div className="p-0">
              <SpecRow label="OS" value={phone.platform.os} />
              <SpecRow label="Chipset" value={phone.platform.chipset} />
              <SpecRow label="CPU" value={phone.platform.cpu} />
              <SpecRow label="GPU" value={phone.platform.gpu} />
            </div>
          </div>
        )}

        {phone.camera && (
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">📸 Camera</h3>
            </div>
            <div className="p-0">
              <SpecRow label="Main Setup" value={phone.camera.setup} />
              <SpecRow label="Selfie Camera" value={`${phone.camera.selfie_mp} MP`} />
              <SpecRow label="Features" value={phone.camera.features} />
              <SpecRow label="Video" value={phone.camera.video} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string, value?: string | number | boolean }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
      <div className="col-span-1 text-sm font-semibold text-gray-500">{label}</div>
      <div className="col-span-2 text-sm text-gray-900">{value}</div>
    </div>
  );
}
