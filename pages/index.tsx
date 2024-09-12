'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Box, Flex, Heading, Text } from '@chakra-ui/layout'
import { Input } from '@chakra-ui/input'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { Checkbox } from '@chakra-ui/checkbox'
import React from 'react'
import { FormControl, FormLabel } from '@chakra-ui/form-control'
import { Radio, RadioGroup } from '@chakra-ui/react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type SensorData = {
  timestamp: string;
  [key: string]: string;
}

type Files = { [name: string]: FileData }
type FileData = {
  size: number,
  lastModified: number,
  uploadedAt: number, sensorList: string[], data: SensorData[]
}

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'category',
      title: {
        display: true,
        text: 'Timestamp'
      }
    },
    y: {
      type: 'linear',
      title: {
        display: true,
        text: 'Value'
      }
    }
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Sensor Data Chart',
    },
  },
}

function humanFileSize(size) {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

export default function Component() {
  const [sensors, setSensors] = useState<string[]>([])
  const [files, setFiles] = useState<Files | null>(null)
  const [selectedFileName, setSelectedFileName] = useState(null)
  const [parsedData, setParsedData] = useState<SensorData[]>([])
  const [selectedSensors, setSelectedSensors] = useState<string[]>([])
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    const files = JSON.parse(window.localStorage.getItem("csv_files")) as Files
    setFiles(files === null ? {} : files)
  }, [])

  useEffect(() => {
    window.localStorage.setItem("csv_files", JSON.stringify(files))
  }, [files])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file.name in files) {
      const confirmation = confirm(`Your file was already uploaded
Uploaded: ${new Date(files[file.name].uploadedAt).toLocaleString()}
Last modified: ${new Date(files[file.name].lastModified).toLocaleString()}
Size: ${humanFileSize(files[file.name].size)}

Do you want to overwrite this file or cancel?`)
      if (!confirmation) {
        return
      }
    }
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          if (result.data && result.data.length > 1) {
            const headers = result.data[0] as string[]
            const sensorList = headers.slice(1) // Exclude "Device Time"
            //setSensors(sensorList)

            const data: SensorData[] = []
            for (let i = 1; i < result.data.length; i++) {
              const row = result.data[i] as string[]
              const rowData: SensorData = { timestamp: row[0] }
              sensorList.forEach((sensor, index) => {
                rowData[sensor] = row[index + 1]
              })
              data.push(rowData)
            }

            //setParsedData(data)
            const finalFiles = { ...files }
            finalFiles[file.name] = {
              size: file.size,
              lastModified: file.lastModified,
              uploadedAt: +(new Date()),
              sensorList,
              data
            }
            setFiles(finalFiles)
          }
        },
        header: false,
      })
    }
  }

  const toggleSensor = (sensor: string) => {
    setSelectedSensors(prev =>
      prev.includes(sensor)
        ? prev.filter(s => s !== sensor)
        : [...prev, sensor]
    )
  }

  useEffect(() => {
    if (parsedData.length > 0 && selectedSensors.length > 0) {
      const labels = parsedData.map(row => row.timestamp)
      const datasets = selectedSensors.map(sensor => ({
        label: sensor,
        data: parsedData.map(row => parseFloat(row[sensor]) || 0),
        borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.5)`,
      }))

      setChartData({
        labels,
        datasets,
      })
    }
  }, [parsedData, selectedSensors])

  function selectFile(name: string) {
    setSelectedSensors([])
    setChartData(null)
    setParsedData([])
    setSelectedFileName(name)
    setSensors([])
    setParsedData([])
    setTimeout(() => {
      setSensors(files[name].sensorList)
      setParsedData(files[name].data)
    }, 1)
  }

  return (
    <Flex mx="auto" p={4} flexDir="column" minH="100vh">
      <Heading size="2xl" mb={4}>Multi-Sensor CSV Data Chart</Heading>
      <Flex flexDir='row' gap={4} flexGrow={1}>
        <Card >
          <CardHeader>
            <Heading size="md">Files</Heading>
          </CardHeader>
          <CardBody>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              mb={4}
            />
            <Box className="h-[300px] md:h-[70vh] pr-4">
              {!!files && Object.keys(files).length > 0 && (
            <FormControl>
            <RadioGroup as={Flex} flexDir="column">
                  {Object.entries(files).map(([name, { size }]) => (
                    <Radio
                      key={name}
                      value={name}
                      checked={selectedFileName === name}
                      onChange={() => selectFile(name)}
                    >

                      {name} ({humanFileSize(size)})
                    </Radio>
                  ))}
                  </RadioGroup></FormControl>
                )}
            </Box>
          </CardBody>
        </Card>
        <Card >
          <CardHeader>
            <Heading size="md">Sensors</Heading>
          </CardHeader>
          <CardBody>
            <Box className="h-[300px] md:h-[70vh] pr-4">
              {sensors.map((sensor) => (
                <FormControl as={Box} key={sensor} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={sensor}
                    checked={selectedSensors.includes(sensor)}
                    onChange={() => toggleSensor(sensor)}
                  >

                    {sensor}
                  </Checkbox>
                </FormControl>
              ))}
            </Box>
          </CardBody>
        </Card>
        <Card flexGrow={1} className="w-full md:w-2/3">
          <CardHeader>
            <Heading size="md">Graph</Heading>
          </CardHeader>
          <CardBody>
            <Box position="relative" height="100%" width="100%">
              {chartData && <Line options={chartOptions} data={chartData} />}
            </Box>
          </CardBody>
        </Card>
      </Flex>
    </Flex>
  )
}