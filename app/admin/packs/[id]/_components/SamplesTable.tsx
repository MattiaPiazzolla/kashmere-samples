'use client'

import SampleRow, { Sample } from './SampleRow'

type SamplesTableProps = {
  samples: Sample[]
  onEdit: (sample: Sample) => void
  onMutate: () => void
}

export default function SamplesTable({ samples, onEdit, onMutate }: SamplesTableProps) {
  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">Title</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">BPM / Key</th>
            <th className="py-3 px-4">Price</th>
            <th className="py-3 px-4">MIDI</th>
            <th className="py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-neutral-950">
          {samples.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-neutral-600 text-sm">
                No samples yet. Add the first one above.
              </td>
            </tr>
          ) : (
            samples.map(sample => (
              <SampleRow
                key={sample.id}
                sample={sample}
                onEdit={onEdit}
                onMutate={onMutate}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
