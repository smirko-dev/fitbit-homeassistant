registerSettingsPage(({ settings }) => (
<Page>
    <Section>
        <TextInput label="URL" settingsKey="url" placeholder="https://127.0.0.1" />
        <TextInput label="Token" settingsKey="token" />
    </Section>
    <Section>
        <AdditiveList title="Entities" settingsKey="entities" description="List of entities" maxItems="30" addAction={
          <TextInput
            title="Add entity"
            label="Click to add an entity"
            placeholder="Entity"
            action="Add Item"
          />
        }/>
    </Section>
</Page>
));
