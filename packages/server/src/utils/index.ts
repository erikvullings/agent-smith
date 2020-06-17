export const extractScenarioName = (url: string) => {
  const match = /\/(\w*)$/g.exec(url);
  return (match && match.length > 1 && match[1]) || '';
};
