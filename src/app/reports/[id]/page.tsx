import { ReportDetail } from "./ReportDetail";

export default async function ReportPage({ params }: PageProps<"/reports/[id]">) {
  const { id } = await params;
  return <ReportDetail id={id} />;
}
