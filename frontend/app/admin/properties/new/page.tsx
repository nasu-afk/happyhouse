import { AdminNav } from "@/components/admin/AdminNav";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const metadata = { title: "Add Property" };

export default function NewPropertyPage() {
  return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-8">
        <h1 className="font-display text-3xl text-ink mb-8">Add property</h1>
        <PropertyForm />
      </div>
    </div>
  );
}
