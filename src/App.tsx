import React from "react";
import "./App.css";

const NUM_PAGES = 10;
const PAGE_SIZE = 10;

const KEYWORDS = [
  "ai",
  "genai",
  "generative ai",
  "prompt",
  "prompt engineering",
  "gpt",
  "chatgpt",
];

const HYPE_LEVELS: [number, string][] = [
  [0.99, "CATASTROPHIC"],
  [0.74, "EXTREME"],
  [0.49, "SEVERE"],
  [0.24, "VERY HIGH"],
  [0.11, "HIGH"],
  [0, "LOW-MODERATE"],
];

async function fetchPosts(page: number) {
  const response = await fetch(
    `https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&page=${page}&hitsPerPage=${PAGE_SIZE}`
  );
  const data = await response.json();
  const titles = data.hits.map((hit: { title: string }) => hit.title);
  const hasKeywords = titles.filter((title: string) =>
    KEYWORDS.some((keyword) => {
      const titleLower = title.toLowerCase();
      return (
        titleLower.includes(` ${keyword}`) ||
        titleLower.includes(`${keyword} `) ||
        titleLower.includes(`${keyword}-`) ||
        titleLower.includes(`-${keyword}`)
      );
    })
  );
  return [page, hasKeywords.length];
}

function getColor(value: number): string {
  const hue = ((1 - value) * 120).toString(10);
  return `hsl(${hue},100%,50%)`;
}

function resolveHypeLevel(hype: number): string {
  const hypeLevel = HYPE_LEVELS.find(([lowerBound]) => hype >= lowerBound);
  return !!hypeLevel ? hypeLevel[1] : "-";
}

function Gauge({
  fill,
  percent,
}: {
  fill: number;
  percent: number;
}): React.JSX.Element {
  // Courtesy of https://www.fullstack.com/labs/resources/blog/creating-an-svg-gauge-component-from-scratch
  const radius = document.body.clientWidth / 3;
  const strokeWidth = radius * 0.2;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = innerRadius * 2 * Math.PI;
  const arc = circumference * (270 / 360);
  const dashArray = `${arc} ${circumference}`;
  const transform = `rotate(135, ${radius}, ${radius})`;
  const percentNormalized = Math.min(Math.max(fill * 100, 0), 100);
  const offset = arc - (percentNormalized / 100) * arc;
  return (
    <svg
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx={radius}
        cy={radius}
        fill="transparent"
        r={innerRadius}
        stroke="gray"
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        transform={transform}
        strokeLinecap="round"
      />
      <circle
        cx={radius}
        cy={radius}
        fill="transparent"
        r={innerRadius}
        stroke={getColor(fill)}
        strokeDasharray={dashArray}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        style={{
          transition: "stroke-dashoffset 1s",
        }}
        transform={transform}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={radius / 6}
        fill="white"
      >
        {resolveHypeLevel(fill)}
      </text>
      <text
        x="50%"
        y="40%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={radius / 8}
        fill="white"
      >
        {percent.toFixed(0)}%
      </text>
    </svg>
  );
}

function calculateHype(x: number): number {
  return 1 / (1 + Math.E ** ((-x + 0.3) * 12));
}

function App() {
  const [counts, setState] = React.useState<{ [key: number]: number }>({});

  React.useEffect(() => {
    [...Array(NUM_PAGES).keys()].forEach((_page) => {
      fetchPosts(_page).then(([page, hasKeywords]) =>
        setState((state) => ({
          ...state,
          [page]: hasKeywords,
        }))
      );
    });
  }, []);

  const hasKeywordsTotal = Object.values(counts).reduce(
    (a: number, b: number) => a + b,
    0
  );
  const total = NUM_PAGES * PAGE_SIZE;
  const percent = hasKeywordsTotal / total;
  const hype = calculateHype(percent);

  return (
    <>
      <div className="header">
        <h1>AI HYPE</h1>
        <p>
          as measured by the percentage of the latest 100 "Show HN" posts on{" "}
          <a
            href="https://news.ycombinator.com/shownew"
            target="_blank"
            rel="noreferrer"
          >
            Hacker News
          </a>{" "}
          which contain AI related keywords
        </p>
        <p>
          the hype dial severity greatly increases as the percentage of posts
          approaches 100%
        </p>
      </div>
      <Gauge fill={hype} percent={percent * 100} />
    </>
  );
}

export default App;
