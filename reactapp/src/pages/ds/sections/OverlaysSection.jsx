import { useState } from "react";
import { Info, LogOut, Menu, User } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
  Sheet,
  SheetContent,
  SheetTrigger,
  ToastCard,
  Tooltip,
  toast,
} from "@/components/ds";
import { Demo, Section } from "./Section";

export default function OverlaysSection() {
  const [v, setV] = useState("");
  return (
    <Section id="overlays" title="Dialog / Sheet / Popover / DropdownMenu / Tooltip / Toast">
      <Demo label="Triggers (Esc closes, focus is trapped)">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent title="Leave the battle?" description="Your current attempt is kept for 60 seconds.">
            <div className="grid gap-4">
              <Input label="Reason (optional)" placeholder="Short note" />
              <Select label="Report as" placeholder="Pick one" value={v} onValueChange={setV}>
                <SelectItem value="afk">Opponent idle</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Stay</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="danger">Leave</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <IconButton icon={Menu} variant="secondary" aria-label="Open menu sheet" />
          </SheetTrigger>
          <SheetContent title="Menu">
            <nav className="grid gap-4 font-mono text-h3 uppercase">
              <span>Visualizers</span>
              <span>Problems</span>
              <span>Battle</span>
            </nav>
          </SheetContent>
        </Sheet>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="text-fg-muted">Opaque --surface with a --border-strong edge. No shadow.</p>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton icon={User} variant="secondary" aria-label="Account menu" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Store</DropdownMenuItem>
            <DropdownMenuItem>Inventory</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger">
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip content="Tooltips are an inverted chip">
          <IconButton icon={Info} aria-label="Tooltip example" />
        </Tooltip>
        <Button onClick={() => toast({ tone: "info", title: "Heads up", description: "Info toast from /__ds." })}>Toast info</Button>
        <Button onClick={() => toast({ tone: "ok", title: "Saved", description: "Your solution was submitted." })}>Toast ok</Button>
        <Button variant="danger" onClick={() => toast({ tone: "err", title: "Submit failed", description: "Can't reach the judge." })}>
          Toast err
        </Button>
      </Demo>
      <Demo label="Toast cards (static)" className="items-start">
        <ToastCard tone="info" title="Heads up" description="Info toast." className="w-72" />
        <ToastCard tone="ok" title="Saved" description="Your solution was submitted." className="w-72" />
        <ToastCard tone="err" title="Submit failed" description="Can't reach the judge." className="w-72" />
      </Demo>
    </Section>
  );
}
