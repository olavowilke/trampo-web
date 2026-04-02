import { AppShell, Group, Title, Text, ActionIcon, Menu } from '@mantine/core'
import { IconLogout, IconUser } from '@tabler/icons-react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <AppShell header={{ height: 56 }} padding="0">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3} c="blue">
            Trampo
          </Title>

          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label="Menu do usuário">
                <IconUser size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {user && (
                <>
                  <Menu.Label>{user.name}</Menu.Label>
                  <Menu.Label>
                    <Text size="xs" c="dimmed">
                      {user.businessName}
                    </Text>
                  </Menu.Label>
                  <Menu.Divider />
                </>
              )}
              <Menu.Item
                leftSection={<IconLogout size={14} />}
                color="red"
                onClick={logout}
              >
                Sair
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
