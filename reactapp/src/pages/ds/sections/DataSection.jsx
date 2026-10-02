import {
  Avatar,
  Badge,
  ListRow,
  Progress,
  Skeleton,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ds";
import { Demo, Section } from "./Section";

const ROWS = [
  { rank: 1, name: "Ada Lovelace", xp: 12840, solved: 412 },
  { rank: 2, name: "Alan Turing", xp: 11205, solved: 388 },
  { rank: 3, name: "Grace Hopper", xp: 9870, solved: 341 },
  { rank: 4, name: "Edsger Dijkstra", xp: 9012, solved: 322 },
];

export default function DataSection() {
  return (
    <Section id="data" title="Table / ListRow / Stat / Progress / Avatar / Skeleton">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell align="right">Rank</TableHeaderCell>
            <TableHeaderCell>Player</TableHeaderCell>
            <TableHeaderCell align="right">XP</TableHeaderCell>
            <TableHeaderCell align="right">Solved</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ROWS.map((r) => (
            <TableRow key={r.rank} interactive>
              <TableCell align="right">{r.rank}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell align="right">{r.xp.toLocaleString("en-US")}</TableCell>
              <TableCell align="right">{r.solved}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border border-border bg-surface">
        <ListRow leading={<Avatar name="Ada Lovelace" />} title="Ada Lovelace" meta="12,840 XP" trailing={<Badge tone="accent">#1</Badge>} />
        <ListRow
          as="button"
          type="button"
          interactive
          leading={<Avatar name="Alan Turing" />}
          title="Alan Turing (interactive)"
          meta="11,205 XP"
          trailing={<Badge>#2</Badge>}
        />
      </div>
      <Demo label="Stat" className="gap-12">
        <Stat label="Solved" value="412" delta="+12" />
        <Stat label="Win rate" value="58%" delta="-3%" />
        <Stat label="Streak" value="21" hint="days" />
        <Stat label="Rank" value="#1" size="lg" />
      </Demo>
      <Demo label="Progress (4px accent + edge) / indeterminate" className="block">
        <div className="grid gap-4">
          <Progress value={0} label="Progress 0%" />
          <Progress value={40} label="Progress 40%" />
          <Progress value={100} label="Progress 100%" />
          <Progress label="Loading" />
        </div>
      </Demo>
      <Demo label="Avatar (square, initials) / Skeleton">
        <Avatar name="Ada Lovelace" size="sm" />
        <Avatar name="Ada Lovelace" size="md" />
        <Avatar name="Ada Lovelace" size="lg" />
        <Avatar name="Broken Image" src="/__missing.png" />
        <div className="grid w-64 gap-2">
          <Skeleton className="w-48" />
          <Skeleton />
          <Skeleton className="w-32" />
        </div>
      </Demo>
    </Section>
  );
}
