import { Badge, Flex, Text, Title } from '@mantine/core'
import { useCallback } from 'react'
import { UseFormReset } from 'react-hook-form'

import { FormValues } from '../features/search-item'
import { CreatorItem, ZotData } from '../interfaces'
import { insertZotIntoGraph } from '../services/insert-zot-into-graph'
import divStyle from '../styles/Div.module.css'

interface ResultCardProps {
  flag: 'full' | 'table' | 'citation' | 'link' | 'open'
  uuid: string
  item: ZotData
  reset: UseFormReset<FormValues>
}

const Creators = ({
  index,
  length,
  creator,
}: {
  index: number
  length: number
  creator: CreatorItem
}) => {
  return (
    <Text size="sm" mr="0.2rem">
      {creator.firstName} {creator.lastName} ({creator.creatorType})
      {length - index == 1 ? '' : ','}
    </Text>
  )
}

export const ResultCard = ({ flag, uuid, item, reset }: ResultCardProps) => {
  const { title, creators, itemType, citeKey, date } = item

  const insertCitation = useCallback(async () => {
    if (!citeKey || citeKey === 'N/A') {
      logseq.UI.showMsg(
        'Citation key not configured properly in Better BibTex',
        'error',
      )
      return
    }
    const templateStr = (logseq.settings!.citekeyTemplate as string).replace(
      `<% citeKey %>`,
      citeKey,
    )
    await logseq.Editor.insertAtEditingCursor(templateStr)

    reset()
    logseq.hideMainUI()
  }, [item])

  const insertZot = useCallback(async () => {
    const pageName = await insertZotIntoGraph(item)
    reset()
    logseq.hideMainUI()
    if (!pageName) return

    const content = await logseq.Editor.getEditingBlockContent()
    await logseq.Editor.updateBlock(uuid, `${content} [[${pageName}]]`)
  }, [item])

  const insertLink = useCallback(async () => {
    // const templateStr = `[${item.title}](${item.libraryLink})`
    const templateStr = (logseq.settings!.linkTemplate as string).replace(
      `<% title %>`,
      item.title,
    ).replace(
      `<% link %>`,
      item.libraryLink,
    )
    await logseq.Editor.insertAtEditingCursor(templateStr)

    reset()
    logseq.hideMainUI()
  }, [item])

  const insertOpen = useCallback(async () => {
    // const templateStr = `${item.title} {{zotero-imported-file ${item.key}, "${item.filename}"}}`
    if (!item.filename){
      item.filename = "";
    }
    const templateStr = (logseq.settings!.openTemplate as string).replace(
      `<% key %>`,
      item.key,
    ).replace(
      `<% filename %>`,
      item.filename,
    ).replace(
      `<% title %>`,
      item.title,
    )
    await logseq.Editor.insertAtEditingCursor(templateStr)

    reset()
    logseq.hideMainUI()
  }, [item])

  const handleClick = () => {
    if (flag === 'citation') insertCitation()
    if (flag === 'full') insertZot()
    if (flag === 'link') insertLink()
    if (flag === 'open') insertOpen()
  }

  return (
    <Flex
      onClick={handleClick}
      direction="row"
      justify="space-between"
      my="0.2rem"
      className={divStyle.div}
    >
      <Flex p="lg" w="70%" direction="column">
        <Title size="md">
          {title}{' '}
          <Badge radius="sm" color="#A9A9A9" px="0.2rem">
            {itemType}
          </Badge>
        </Title>
        <Flex dir="row" wrap="wrap" mt="0.2rem">
          {creators &&
            creators.map((creator, index) => (
              <Creators
                key={index}
                index={index}
                length={creators.length}
                creator={creator}
              />
            ))}
        </Flex>
        {citeKey && <Text size="xs">Cite Key: {citeKey}</Text>}
      </Flex>
      <Flex p="lg" w="25%" direction="column" align="flex-end">
        <Text size="sm">{date}</Text>
        <Badge
          radius="sm"
          size="sm"
          px="0.2rem"
          color={item.inGraph ? 'green' : 'red'}
        >
          {item.inGraph ? 'in graph' : 'not in graph'}
        </Badge>
      </Flex>
    </Flex>
  )
}
