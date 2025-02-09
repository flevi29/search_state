const coverageDir = Deno.args[0];

if (!coverageDir) {
  throw new Error("No coverage directory provided");
}

Deno.serve((req: Request): Response => {
  const pathname = new URL(req.url).pathname;
  const headers = { "Content-Type": "text/html" };
  const filePath = `${coverageDir}${
    pathname === "/" ? "/index.html" : pathname
  }`;

  return new Response(Deno.readTextFileSync(filePath), {
    headers,
  });
});
