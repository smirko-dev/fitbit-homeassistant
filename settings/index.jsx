
import { gettext } from "i18n";

function settingsFunc(props) {
  let add_title = gettext("add_title");
  let add_label = gettext("add_label");
  return (  
    <Page>
        <Section>
            <TextInput label="URL" settingsKey="url" placeholder="https://127.0.0.1" />
            <TextInput label="Token" settingsKey="token" />
        </Section>
        <Section>
            <AdditiveList title="Entities" settingsKey="entities" description="List of entities" maxItems="30" addAction={
              <TextInput
                title={`${add_title}`}
                label={`${add_label}`}
                placeholder="Entity"
                action="Add Item"
              />
            }/>
        </Section>
    </Page>
  )
}

registerSettingsPage(settingsFunc);
