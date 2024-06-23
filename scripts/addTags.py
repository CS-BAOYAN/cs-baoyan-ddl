import json
import csv

def update_tags_from_csv(json_data, csv_file):
    # 读取CSV文件内容
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        csv_data = list(reader)
    
    # 遍历JSON数据中的每个学校
    for school in json_data['schools']:
        name = school['name']
        tags = school['tags']
        
        # 检查CSV文件中的每一行
        for row in csv_data:
            if name in row[0]:
                if "985" not in tags:
                    tags.append("985")
            if name in row[1]:
                if "211" not in tags:
                    tags.append("211")
            if name in row[2] and "985" not in tags and "211" not in tags:
                if "双非" not in tags:
                    tags.append("双非")
        
        # 更新tags字段
        school['tags'] = tags
    
    return json_data

def main():
    # 读取JSON文件内容
    with open('config/schools.json', 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    # 更新tags字段
    updated_json_data = update_tags_from_csv(json_data, 'config/92.csv')
    
    # 输出为JSON文件
    with open('config/output.json', 'w', encoding='utf-8') as f:
        json.dump(updated_json_data, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    main()
