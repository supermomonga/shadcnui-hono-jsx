import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "../../components/ui/combobox"

const frameworks = ["Next.js", "Remix"]
const people = [{ value: "ada", label: "Ada Lovelace" }]
const groups = [{ value: "Fruits", items: ["Apple", "Banana"] }]

function Chips() {
  const anchor = useComboboxAnchor()
  return (
    <Combobox multiple items={frameworks} defaultValue={["Remix"]} name="fw">
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((value) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export const valid = [
  <Chips />,
  <Combobox
    items={people}
    itemToStringLabel={(p: { label: string }) => p.label}
  >
    <ComboboxInput placeholder="Person" showClear disabled={false} />
    <ComboboxContent side="top" sideOffset={4}>
      <ComboboxEmpty>None</ComboboxEmpty>
      <ComboboxList>
        {(person: { value: string; label: string }) => (
          <ComboboxItem value={person}>{person.label}</ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>,
  <Combobox items={groups}>
    <ComboboxInput />
    <ComboboxContent>
      <ComboboxList>
        {(group: { value: string; items: string[] }) => (
          <ComboboxGroup items={group.items}>
            <ComboboxLabel>{group.value}</ComboboxLabel>
            <ComboboxCollection>
              {(item: string) => (
                <ComboboxItem value={item}>{item}</ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxGroup>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>,
]

export const invalid = [
  // @ts-expect-error: React's className is not accepted
  <ComboboxInput className="w-full" />,
]
