import { useState } from "react";
import { Checkbox, Field, Input, Radio, RadioGroup, SegmentedInput, Select, SelectItem, Switch, Textarea } from "@/components/ds";
import { Section } from "./Section";

export default function FormsSection() {
  const [lang, setLang] = useState("");
  const [agree, setAgree] = useState(true);
  const [sound, setSound] = useState(false);
  const [mode, setMode] = useState("duel");
  const [code, setCode] = useState("AB12");

  return (
    <Section id="forms" title="Form controls">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-6">
          <Input label="Display name" placeholder="ada_l" hint="Shown on the leaderboard" />
          <Input label="Email (error)" defaultValue="ada@" error="Enter a full email address" required />
          <Input label="Focus-visible (forced)" placeholder="Focused" data-force="focus" />
          <Input label="Disabled" placeholder="Not editable" disabled />
          <div className="grid grid-cols-3 gap-2">
            <Input label="sm" size="sm" placeholder="28px" />
            <Input label="md" size="md" placeholder="36px" />
            <Input label="lg" size="lg" placeholder="44px" />
          </div>
          <Textarea label="Notes" placeholder="Explain your approach" hint="Markdown is not rendered" />
        </div>
        <div className="grid content-start gap-6">
          <Select label="Language" placeholder="Pick a language" value={lang} onValueChange={setLang} data-ds-demo="select">
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
            <SelectItem value="js" disabled>
              JavaScript (soon)
            </SelectItem>
          </Select>
          <Select label="Language (error)" placeholder="Required" error="Choose a language" />
          <div className="grid gap-3">
            <Checkbox label="I agree to the rules" checked={agree} onCheckedChange={setAgree} data-ds-demo="checkbox" />
            <Checkbox label="Indeterminate" checked="indeterminate" />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="With error" error="You must accept to continue" />
          </div>
          <div className="grid gap-3">
            <Switch label="Sound effects" checked={sound} onCheckedChange={setSound} data-ds-demo="switch" />
            <Switch label="On (static)" checked onCheckedChange={() => {}} />
            <Switch label="Disabled" disabled />
          </div>
          <RadioGroup label="Battle mode" value={mode} onValueChange={setMode} orientation="horizontal">
            <Radio value="duel" label="Duel" />
            <Radio value="ffa" label="Free for all" />
            <Radio value="team" label="Team (disabled)" disabled />
          </RadioGroup>
          <SegmentedInput label="Room code" length={6} value={code} onChange={setCode} hint="Paste a full code to fill every cell" />
          <Field label="Room code (error)" error="That room does not exist">
            <SegmentedInput length={6} defaultValue="ZZ9" />
          </Field>
        </div>
      </div>
    </Section>
  );
}
