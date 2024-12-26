export function getCurrentYearAndSemester({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const now = new Date();
  let semester = Number(searchParams.get("semester")) || undefined;
  let year = Number(searchParams.get("year")) || now.getFullYear();

  if (!semester) semester = getSemester(now.getMonth());

  return { year, semester };
}

function getSemester(month: number) {
  if (month >= 5 && month <= 8) return 2;
  return 1;
}
