
import { gettext } from "i18n";

function settingsFunc(props) {
  return (  
    <Page>
        <Section>
            <TextInput label="URL" settingsKey="url" placeholder="https://127.0.0.1" />
            <TextInput label="Port" settingsKey="port" placeholder="8123" />
            <TextInput label="Token" settingsKey="token" />
        </Section>
        <Section>
            <AdditiveList title="Entities" settingsKey="entities" description="List of entities" maxItems="30" addAction={
              <TextInput
                title={`${gettext("add_title")}`}
                label={`${gettext("add_label")}`}
                placeholder="Entity"
                action="Add Item"
              />
            }/>
        </Section>
        <Section>
            <Toggle label={`${gettext("force_status")}`} settingsKey="force" />
        </Section>
    </Page>
  )
}

registerSettingsPage(settingsFunc);
